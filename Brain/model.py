import torch
import torch.nn as nn

# =============================================================================
# model.py — PyTorch Model Architectures for Clinical Diagnostics
# (Must exactly match the architectures used in train_flagship.py)
# =============================================================================

class CNN1D(nn.Module):
    """1D Convolutional Neural Network for biological feature extraction."""
    def __init__(self, n_features=9):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv1d(1, 64, kernel_size=3, padding=1),
            nn.ReLU(), 
            nn.BatchNorm1d(64),
            nn.Conv1d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(), 
            nn.AdaptiveAvgPool1d(4),
            nn.Flatten(),
            nn.Linear(128*4, 128), 
            nn.ReLU(), 
            nn.Dropout(0.3),
            nn.Linear(128, 5)
        )
    def forward(self, x):
        # Expects input (Batch, Features, 1) -> Transform to (Batch, 1, Features)
        return self.net(x.transpose(1, 2))

class TransformerClassifier(nn.Module):
    """Transformer Encoder for sequence-based relational feature analysis."""
    def __init__(self, n_features=9):
        super().__init__()
        self.embed = nn.Linear(1, 64)
        enc_layer = nn.TransformerEncoderLayer(
            d_model=64, nhead=4, dim_feedforward=128,
            dropout=0.1, batch_first=True
        )
        self.transformer = nn.TransformerEncoder(enc_layer, num_layers=3)
        self.fc = nn.Sequential(
            nn.Linear(n_features * 64, 128), 
            nn.ReLU(), 
            nn.Dropout(0.3),
            nn.Linear(128, 5)
        )
    def forward(self, x):
        # Expects input (Batch, Features, 1)
        x = self.embed(x)          # (B, F, 64)
        x = self.transformer(x)    # (B, F, 64)
        return self.fc(x.flatten(1))

class HybridCNNTransformer(nn.Module):
    """Hybrid architecture combining CNN local extraction and Transformer global reasoning."""
    def __init__(self, n_features=9):
        super().__init__()
        # Initial local spatial extraction
        self.conv = nn.Sequential(
            nn.Conv1d(n_features, 64, kernel_size=1),
            nn.ReLU(), 
            nn.BatchNorm1d(64)
        )
        # Global relational reasoning
        enc_layer = nn.TransformerEncoderLayer(
            d_model=64, nhead=4, dim_feedforward=256,
            dropout=0.1, batch_first=True
        )
        self.transformer = nn.TransformerEncoder(enc_layer, num_layers=2)
        # Final classification head
        self.fc = nn.Sequential(
            nn.Linear(64, 64), 
            nn.ReLU(), 
            nn.Dropout(0.3),
            nn.Linear(64, 5)
        )
    def forward(self, x):
        # x: (Batch, Features, 1)
        x = self.conv(x).transpose(1, 2)   # (B, 1, 64)
        x = self.transformer(x)            # (B, 1, 64)
        return self.fc(x.mean(1))          # (B, 5)
