import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  Upload, 
  X, 
  Trash2, 
  QrCode, 
  Plus,
  AlertCircle,
  Image as ImageIcon 
} from "lucide-react";
import api from '@/lib/api';

const PaymentQRForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [qrImages, setQrImages] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteUrl, setDeleteUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all QR images
  const fetchQRImages = async () => {
    try {
      const res = await api.get("/payment-qr");
      console.log("API Response:", res.data);
      setQrImages(res.data || []);
    } catch (error) {
      console.error("❌ Failed to fetch QR images:", error);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview URL
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  // Handle upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("qrImage", file);

    try {
      await api.post("/payment-qr", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("pplt20_token")}`,
        },
      });
      setFile(null);
      setPreviewUrl(null);
      setIsModalOpen(false);
      fetchQRImages();
      toast.success("QR uploaded successfully!");
    } catch (error) {
      console.error("❌ Failed to upload QR:", error);
      toast.error("Upload failed!");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete request
  const handleDelete = async (url: string) => {
    try {
      const filename = url.split("/").pop() || "";
      await api.delete(
        `/payment-qr/${encodeURIComponent(filename)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("pplt20_token")}`,
          },
        }
      );
      fetchQRImages();
      setDeleteUrl(null);
      toast.success("QR deleted successfully!");
    } catch (error) {
      console.error("❌ Failed to delete QR:", error);
      toast.error("Delete failed!");
    }
  };

  useEffect(() => {
    fetchQRImages();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <QrCode className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Payment QR Codes</h2>
            <p className="text-sm text-gray-500">Manage your payment QR codes</p>
          </div>
        </div>
        <button
  onClick={() => {
    setIsModalOpen(true);
    setFile(null);
    setPreviewUrl(null);
  }}
  className="
    flex items-center gap-2
    bg-blue-600 hover:bg-blue-700 text-white
    px-3 sm:px-4 py-2 sm:py-2.5
    rounded-xl
    shadow-sm hover:shadow-md
    transition-all duration-200
  "
>
  <Plus className="w-3 sm:w-4 h-3 sm:h-4" />
  <span className="font-medium text-sm sm:text-base">Add QR</span>
</button>

      </div>

      {/* QR Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {qrImages.length > 0 ? (
          qrImages.map((url, index) => (
            <div
              key={url || `qr-${index}`}
              className="relative group rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg"
            >
              <div className="aspect-square bg-gray-50">
                <img
                  src={url}
                  alt="QR Code"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteUrl(url);
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-center">No QR codes uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add QR" to upload your first QR code</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Upload QR Code</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpload} className="p-6">
              <div className="space-y-4">
                {/* File Upload Area */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="qr-upload"
                  />
                  <label
                    htmlFor="qr-upload"
                    className="block w-full cursor-pointer"
                  >
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                      file ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}>
                      {previewUrl ? (
                        <div className="space-y-4">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-32 h-32 mx-auto rounded-lg object-cover"
                          />
                          <p className="text-sm text-gray-600">{file?.name}</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium">Click to upload QR code</p>
                          <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!file || isLoading}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      file && !isLoading
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      'Upload QR Code'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUrl && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm transform transition-all">
            <div className="p-6">
              {/* Icon */}
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete QR Code?
              </h3>
              <p className="text-gray-500 text-center text-sm">
                This action cannot be undone. This QR code will be permanently removed.
              </p>
              
              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleDelete(deleteUrl)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteUrl(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentQRForm;