from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, classification_report
from scipy.stats import wasserstein_distance
import io
import csv
import time
import random
from scipy.special import expit  # For sigmoid in PSO, though not used in LR directly

# Set random seeds for reproducibility
random.seed(42)
np.random.seed(42)

app = FastAPI(
    title="ML Model Performance API",
    description="API for processing IoT attack datasets, applying Wasserstein alignment, and evaluating Logistic Regression.",
    version="1.0.0"
)

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to store trained model, preprocessor, and feature names
trained_model = None
trained_preprocessor = None
trained_feature_names = None


def wasserstein_transform_classwise(Xs, Xt, ys, yt):
    """
    Perform class-wise Wasserstein Distance-based alignment on source features.
    """
    Xs_aligned = np.zeros_like(Xs)
    unique_classes_s = np.unique(ys)
    unique_classes_t = np.unique(yt)

    for cls in unique_classes_s:
        Xs_cls = Xs[ys == cls]
        if cls in unique_classes_t:
            Xt_cls = Xt[yt == cls]
        else:
            Xs_aligned[ys == cls] = Xs_cls
            continue

        if len(Xt_cls) == 0:
            Xs_aligned[ys == cls] = Xs_cls
            continue

        Xs_mean, Xt_mean = np.mean(Xs_cls, axis=0), np.mean(Xt_cls, axis=0)
        Xs_std, Xt_std = np.std(Xs_cls, axis=0), np.std(Xt_cls, axis=0)
        Xs_aligned[ys == cls] = (Xs_cls - Xs_mean) * (Xt_std / (Xs_std + 1e-6)) + Xt_mean

    return Xs_aligned


@app.post("/process-data")
async def process_data(
        source_file: UploadFile = File(...),
        target_file: UploadFile = File(...),
        columns_file: UploadFile = File(...)
):
    global trained_model, trained_preprocessor, trained_feature_names
    start_time = time.time()

    try:
        source_df = pd.read_csv(io.StringIO((await source_file.read()).decode('utf-8')))
        target_df = pd.read_csv(io.StringIO((await target_file.read()).decode('utf-8')))

        useful_columns_df_raw = pd.read_csv(io.StringIO((await columns_file.read()).decode('utf-8')), header=None)
        useful_columns = [col.strip().strip("'") for col in useful_columns_df_raw.iloc[0].tolist()]

        if 'Label' not in useful_columns:
            raise HTTPException(status_code=400,
                                detail="The 'Label' column must be present in the useful columns file.")

        source_df = source_df[useful_columns].dropna()
        target_df = target_df[useful_columns].dropna()

        X_source_df = source_df.drop(columns=['Label'])
        y_source = source_df['Label']
        X_target_df = target_df.drop(columns=['Label'])
        y_target = target_df['Label']

        trained_feature_names = X_source_df.columns.tolist()

        categorical_features = ['Protocol']
        numerical_features = [col for col in trained_feature_names if col != 'Protocol']

        preprocessor = ColumnTransformer(
            [
                ('num', StandardScaler(), numerical_features),
                ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
            ]
        )

        X_source_processed = preprocessor.fit_transform(X_source_df)
        X_target_processed = preprocessor.transform(X_target_df)

        X_source_aligned = wasserstein_transform_classwise(
            X_source_processed, X_target_processed, y_source.values, y_target.values
        )

        lr = LogisticRegression(max_iter=5000, random_state=42)
        lr.fit(X_source_aligned, y_source)

        trained_model = lr
        trained_preprocessor = preprocessor

        pred_after = lr.predict(X_target_processed)

        # Compute metrics
        acc_after = accuracy_score(y_target, pred_after)
        f1_after = f1_score(y_target, pred_after, average='weighted')
        precision_after = precision_score(y_target, pred_after, average='weighted')
        recall_after = recall_score(y_target, pred_after, average='weighted')
        report_after = classification_report(y_target, pred_after, output_dict=True, zero_division=0)

        class_wise_metrics = {
            label: {
                "precision": metrics.get("precision", 0.0),
                "recall": metrics.get("recall", 0.0),
                "f1-score": metrics.get("f1-score", 0.0),
                "support": metrics.get("support", 0)
            }
            # MODIFICATION START: Exclude 'accuracy' explicitly from this loop
            for label, metrics in report_after.items() if
            label != 'accuracy' and (label.isdigit() or label in ['macro avg', 'weighted avg'])
            # MODIFICATION END
        }

        processing_time = time.time() - start_time

        # Create CSV content as string
        pred_csv_io = io.StringIO()
        writer = csv.writer(pred_csv_io)
        writer.writerow(['Label'])
        for val in pred_after:
            writer.writerow([val])
        csv_content = pred_csv_io.getvalue()

        return {
            "metrics": {
                "accuracy": acc_after,
                "f1_score": f1_after,
                "precision": precision_after,
                "recall": recall_after,
                "class_wise": class_wise_metrics,
                "processing_time": processing_time
            },
            "csv": csv_content
        }

    except Exception as e:
        trained_model = None
        trained_preprocessor = None
        trained_feature_names = None
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-single")
async def predict_single(single_file: UploadFile = File(...)):
    global trained_model, trained_preprocessor, trained_feature_names

    try:
        if trained_model is None or trained_preprocessor is None or trained_feature_names is None:
            raise HTTPException(status_code=400,
                                detail="Model has not been trained yet. Please call /process-data first.")

        df = pd.read_csv(io.StringIO((await single_file.read()).decode('utf-8')))

        if df.shape[0] != 1:
            raise HTTPException(status_code=400, detail="Input file must contain exactly one row.")

        missing_cols = set(trained_feature_names) - set(df.columns)
        if missing_cols:
            raise HTTPException(status_code=400,
                                detail=f"Single row CSV is missing expected feature columns: {', '.join(missing_cols)}")

        df_reordered = df[trained_feature_names]

        X_processed = trained_preprocessor.transform(df_reordered)
        prediction = trained_model.predict(X_processed)

        return {"prediction": int(prediction[0])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))