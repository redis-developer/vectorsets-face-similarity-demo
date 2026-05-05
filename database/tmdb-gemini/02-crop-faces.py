"""
02-crop-faces.py — Detect and crop faces from profile photos using MediaPipe.

Reads images from output/images-hq/ (or a custom input dir), detects the primary
face in each image, crops with padding, and saves to output/images-cropped/.

Setup:
    pip install mediapipe Pillow

Usage:
    python 02-crop-faces.py [options]

Options:
    --input <dir>       Input image directory  (default: output/images-hq)
    --output <dir>      Output directory       (default: output/images-cropped)
    --padding <float>   Padding around face    (default: 0.35, meaning 35%)
    --quality <int>     JPEG save quality      (default: 95)
    --min-conf <float>  Min detection confidence (default: 0.5)
    --report <path>     JSON report output     (default: output/crop-report.json)
    --overwrite         Re-crop already processed images
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path

import numpy as np
from PIL import Image
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision


# ──────────── Args ────────────

def parse_args():
    p = argparse.ArgumentParser(description="Crop faces from images using MediaPipe")
    script_dir = Path(__file__).resolve().parent
    p.add_argument("--input", default=str(script_dir / "output" / "images-hq"))
    p.add_argument("--output", default=str(script_dir / "output" / "images-cropped"))
    p.add_argument("--padding", type=float, default=0.35)
    p.add_argument("--quality", type=int, default=95)
    p.add_argument("--min-conf", type=float, default=0.5)
    p.add_argument("--report", default=str(script_dir / "output" / "crop-report.json"))
    p.add_argument("--overwrite", action="store_true")
    return p.parse_args()


# ──────────── Model setup ────────────

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite"
MODEL_FILENAME = "blaze_face_short_range.tflite"


def ensure_model(script_dir: Path) -> Path:
    """Download the MediaPipe face detection model if not present."""
    model_path = script_dir / MODEL_FILENAME
    if model_path.exists():
        return model_path

    print(f"Downloading face detection model to {model_path}...")
    try:
        import subprocess
        subprocess.run(
            ["curl", "-L", "-o", str(model_path), MODEL_URL],
            check=True, capture_output=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        import ssl, urllib.request
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        urllib.request.urlretrieve(MODEL_URL, str(model_path), context=ctx)

    print(f"Model downloaded ({model_path.stat().st_size / 1024:.0f} KB)")
    return model_path


def create_detector(model_path: Path, min_confidence: float):
    """Create a MediaPipe FaceDetector in IMAGE mode."""
    base_options = mp_python.BaseOptions(
        model_asset_path=str(model_path),
        delegate=mp_python.BaseOptions.Delegate.CPU,
    )
    options = mp_vision.FaceDetectorOptions(
        base_options=base_options,
        running_mode=mp_vision.RunningMode.IMAGE,
        min_detection_confidence=min_confidence,
    )
    return mp_vision.FaceDetector.create_from_options(options)


# ──────────── Crop logic ────────────

def crop_face(img: Image.Image, detection, padding: float) -> Image.Image:
    """Crop a face from a PIL image given a MediaPipe detection result."""
    w, h = img.size
    bbox = detection.bounding_box

    # Bounding box from MediaPipe (pixel coords)
    x_min = bbox.origin_x
    y_min = bbox.origin_y
    box_w = bbox.width
    box_h = bbox.height

    # Center of the face
    cx = x_min + box_w / 2
    cy = y_min + box_h / 2

    # Make it square, use the larger dimension
    face_size = max(box_w, box_h)

    # Add padding
    padded_size = face_size * (1 + padding)
    half = padded_size / 2

    # Crop coordinates (clamped to image bounds)
    x1 = max(0, int(cx - half))
    y1 = max(0, int(cy - half))
    x2 = min(w, int(cx + half))
    y2 = min(h, int(cy + half))

    return img.crop((x1, y1, x2, y2))


# ──────────── Main ────────────

def main():
    args = parse_args()
    script_dir = Path(__file__).resolve().parent

    input_dir = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not input_dir.exists():
        print(f"❌ Input directory not found: {input_dir}")
        print("   Run 01-fetch-hq.js first to download images.")
        sys.exit(1)

    # Collect image files
    extensions = {".jpg", ".jpeg", ".png"}
    files = sorted(
        f for f in input_dir.iterdir()
        if f.suffix.lower() in extensions
    )

    if not files:
        print(f"❌ No images found in {input_dir}")
        sys.exit(1)

    print(f"🔍 Face Cropper (MediaPipe)")
    print(f"   Input:   {input_dir} ({len(files)} images)")
    print(f"   Output:  {output_dir}")
    print(f"   Padding: {args.padding:.0%} | Quality: {args.quality} | Min conf: {args.min_conf}")
    print()

    # Setup model + detector
    model_path = ensure_model(script_dir)
    detector = create_detector(model_path, args.min_conf)

    # Track results
    results = {"cropped": [], "no_face": [], "error": []}
    t0 = time.time()
    cropped_count = 0
    no_face_count = 0
    error_count = 0
    skipped_count = 0

    for i, fpath in enumerate(files):
        out_path = output_dir / fpath.name

        # Skip if already processed
        if out_path.exists() and not args.overwrite:
            skipped_count += 1
            continue

        try:
            pil_img = Image.open(fpath).convert("RGB")
            rgb_array = np.asarray(pil_img)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_array)
            detections = detector.detect(mp_image)

            if detections.detections:
                # Pick the detection with highest confidence
                best = max(detections.detections, key=lambda d: d.categories[0].score)
                conf = best.categories[0].score
                cropped_img = crop_face(pil_img, best, args.padding)
                cropped_img.save(str(out_path), "JPEG", quality=args.quality)

                cropped_count += 1
                results["cropped"].append({
                    "file": fpath.name,
                    "confidence": round(conf, 4),
                    "original_size": list(pil_img.size),
                    "cropped_size": list(cropped_img.size),
                })
            else:
                # No face — save original as-is
                pil_img.save(str(out_path), "JPEG", quality=args.quality)
                no_face_count += 1
                results["no_face"].append(fpath.name)

        except Exception as e:
            error_count += 1
            results["error"].append({"file": fpath.name, "error": str(e)})

        # Progress
        processed = cropped_count + no_face_count + error_count
        if processed % 200 == 0 and processed > 0:
            elapsed = time.time() - t0
            rate = processed / elapsed
            eta = (len(files) - skipped_count - processed) / rate if rate > 0 else 0
            print(
                f"  ✂️  {processed}/{len(files) - skipped_count} "
                f"({cropped_count} cropped, {no_face_count} no-face, {error_count} err) "
                f"[{rate:.0f} img/s, ETA {eta:.0f}s]"
            )

    detector.close()
    elapsed = time.time() - t0

    # Write report
    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    summary = {
        "total_files": len(files),
        "cropped": cropped_count,
        "no_face": no_face_count,
        "errors": error_count,
        "skipped_existing": skipped_count,
        "elapsed_seconds": round(elapsed, 1),
        "details": results,
    }
    with open(report_path, "w") as f:
        json.dump(summary, f, indent=2)

    print()
    print(f"✅ Done in {elapsed:.1f}s")
    print(f"   ✂️  Cropped:  {cropped_count}")
    print(f"   ⚠️  No face:  {no_face_count} (kept original)")
    print(f"   ❌ Errors:   {error_count}")
    print(f"   ⏭️  Skipped:  {skipped_count} (already existed)")
    print(f"   📝 Report:   {report_path}")

    if no_face_count > 0:
        print(f"\n   No-face files (review manually):")
        for name in results["no_face"][:10]:
            print(f"     - {name}")
        if no_face_count > 10:
            print(f"     ... and {no_face_count - 10} more (see report)")


if __name__ == "__main__":
    main()
