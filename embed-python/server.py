# server.py
from fastapi import FastAPI, UploadFile, File
from PIL import Image
import torch
from transformers import ViTImageProcessor, ViTForImageClassification
import uvicorn
import io

MODEL_ID = "tonyassi/celebrity-classifier"  # same checkpoint

app = FastAPI()
processor = ViTImageProcessor.from_pretrained(MODEL_ID)
model = ViTForImageClassification.from_pretrained(MODEL_ID, output_hidden_states=True)
model.eval()

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/embed")
async def embed(file: UploadFile = File(...)):
    image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        out = model(**inputs, output_hidden_states=True)
        # ViT backbone hidden size = 768
        # Use CLS token from last hidden state (or pooled mean)
        last_hidden = out.hidden_states[-1]       # (1, seq_len, 768)
        cls = last_hidden[:, 0, :]               # (1, 768)
        emb = torch.nn.functional.normalize(cls, dim=-1)  # L2 normalize
    return {"embedding": emb.squeeze(0).tolist()}  # length 768

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8009)