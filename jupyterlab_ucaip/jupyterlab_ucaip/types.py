from enum import Enum


class ModelFramework(Enum):
  """Enum for the supported custom model frameworks 
  """
  SKLEARN_CPU_0_20 = "sklearn-cpu.0-20"
  SKLEARN_CPU_0_22 = "sklearn-cpu.0-22"
  TF_CPU_1_15 = "tf-cpu.1-15"
  TF_GPU_1_15 = "tf-gpu.1-15"
  TF_CPU_2_1 = "tf2-cpu.2-1"
  TF_GPU_2_1 = "tf2-gpu.2-1"
  XGBOOST_CPU_0_82 = "xgboost-cpu.0-82"
  XGBOOST_CPU_0_90 = "xgboost-cpu.0-90"


class ModelType(Enum):
  OTHER = "OTHER"
  TABLE = "TABLE"
  IMAGE = "IMAGE"


class DatasetType(Enum):
  OTHER = "OTHER"
  TABLE = "TABLE"
  IMAGE = "IMAGE"
