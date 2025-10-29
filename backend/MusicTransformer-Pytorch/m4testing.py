import torch

if torch.backends.mps.is_available():
    print("MPS is available and will be used.")
else:
    print("MPS is not available. Training will fall back to CPU.")