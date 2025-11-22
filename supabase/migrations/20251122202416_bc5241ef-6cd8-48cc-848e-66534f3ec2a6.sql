-- Create storage bucket for ML models
INSERT INTO storage.buckets (id, name, public)
VALUES ('ml-models', 'ml-models', true)
ON CONFLICT (id) DO NOTHING;