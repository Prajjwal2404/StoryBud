from voxcpm import VoxCPM


class VoxCPMService:
    _instance = None
    model = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = VoxCPMService()
        return cls._instance

    def initialize_model(self):
        print("Initializing VoxCPM model...")
        try:
            self.model = VoxCPM.from_pretrained() 
            print("VoxCPM model loaded successfully.")
        except Exception as e:
            print(f"Error loading VoxCPM model: {e}")

    def get_model(self):
        return self.model

voxcpm_service = VoxCPMService.get_instance()
