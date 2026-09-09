import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Upload,
  X,
  Trash2,
  QrCode,
  Plus,
  AlertCircle,
  Image as ImageIcon,
  Pencil,
} from "lucide-react";
import api from "@/lib/api";

interface QRImage {
  url: string;
  public_id: string;
}

const PaymentQRForm: React.FC = () => {
  const [qrImages, setQrImages] = useState<QRImage[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteQr, setDeleteQr] = useState<QRImage | null>(null);
  const [editingQr, setEditingQr] = useState<QRImage | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchQRImages = async () => {
    try {
      const res = await api.get("/payment-qr");
      const qrs = res.data?.qrs ?? [];
      if (!Array.isArray(qrs)) {
        setQrImages([]);
        return;
      }
      setQrImages(qrs.map((qr: any) => ({ url: qr.url, public_id: qr.public_id })));
    } catch (error) {
      console.error("Failed to fetch QR images:", error);
      toast.error("Failed to load QR images");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("qrImage", file);

    try {
      const res = await api.post("/payment-qr", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success("QR uploaded successfully");
        setFile(null);
        setPreviewUrl(null);
        setIsUploadModalOpen(false);
        fetchQRImages();
      } else {
        toast.error(res.data?.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Failed to upload QR:", error);
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (qr: QRImage) => {
    setEditingQr(qr);
    setFile(null);
    setPreviewUrl(qr.url);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !editingQr) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("qrImage", file);

    try {
      const res = await api.put(`/payment-qr/${encodeURIComponent(editingQr.public_id)}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success("QR updated successfully");
        setFile(null);
        setPreviewUrl(null);
        setEditingQr(null);
        setIsEditModalOpen(false);
        fetchQRImages();
      } else {
        toast.error(res.data?.message || "Update failed");
      }
    } catch (error: any) {
      console.error("Failed to update QR:", error);
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (qr: QRImage) => {
    if (!qr.public_id) {
      toast.error("Invalid QR code ID");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await api.delete(`/payment-qr/${encodeURIComponent(qr.public_id)}`);

      if (res.data?.success) {
        toast.success("QR deleted successfully");
        setDeleteQr(null);
        fetchQRImages();
      } else {
        toast.error(res.data?.message || "Delete failed");
      }
    } catch (error: any) {
      console.error("Failed to delete QR:", error);
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchQRImages();
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-xl flex items-center justify-center">
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Payment QR Codes</h2>
            <p className="text-sm text-slate-500">Upload and manage payment QR codes</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsUploadModalOpen(true);
            setFile(null);
            setPreviewUrl(null);
          }}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium text-sm">Add QR Code</span>
        </button>
      </div>

      {/* QR Images List */}
      {qrImages.length > 0 ? (
        <div className="space-y-4">
          {qrImages.map((qr, index) => (
            <div
              key={qr.public_id}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200"
            >
              {/* Image */}
              <div className="w-full sm:w-32 h-48 sm:h-32 bg-white rounded-lg overflow-hidden border border-slate-200 shrink-0">
                <img
                  src={qr.url}
                  alt={`QR Code ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info + Actions */}
              <div className="flex-1 min-w-0">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-900">QR Code #{index + 1}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{qr.public_id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditClick(qr)}
                    className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteQr(qr)}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
          </div>
          <p className="text-base sm:text-lg text-slate-500 font-medium text-center">No QR codes uploaded yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Click "Add QR Code" to upload your first QR code
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Upload QR Code</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 sm:p-6">
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="qr-upload"
                  />
                  <label htmlFor="qr-upload" className="block w-full cursor-pointer">
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all duration-200 ${
                        file
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {previewUrl ? (
                        <div className="space-y-4">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-36 h-36 sm:w-40 sm:h-40 mx-auto rounded-xl object-cover shadow-md"
                          />
                          {file && <p className="text-sm text-slate-600 font-medium">{file.name}</p>}
                          <p className="text-xs text-slate-400">Click to change image</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-base sm:text-lg text-slate-700 font-medium">Click to upload QR code</p>
                          <p className="text-sm text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!file || isLoading}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${
                      file && !isLoading
                        ? "bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow-md"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      "Upload QR Code"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-3 rounded-xl font-semibold text-sm sm:text-base text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingQr && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Update QR Code</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingQr(null);
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 sm:p-6">
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="qr-edit"
                  />
                  <label htmlFor="qr-edit" className="block w-full cursor-pointer">
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all duration-200 ${
                        file
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {previewUrl ? (
                        <div className="space-y-4">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-36 h-36 sm:w-40 sm:h-40 mx-auto rounded-xl object-cover shadow-md"
                          />
                          {file && <p className="text-sm text-slate-600 font-medium">{file.name}</p>}
                          <p className="text-xs text-slate-400">Click to change image</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-base sm:text-lg text-slate-700 font-medium">Click to upload new QR code</p>
                          <p className="text-sm text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!file || isLoading}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${
                      file && !isLoading
                        ? "bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow-md"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      "Update QR Code"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingQr(null);
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="px-4 py-3 rounded-xl font-semibold text-sm sm:text-base text-slate-700 hover:bg-slate-100 transition-colors"
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
      {deleteQr && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 sm:p-8">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-900 text-center mb-2">
                Delete QR Code?
              </h3>
              <p className="text-slate-500 text-center text-sm sm:text-base">
                This action cannot be undone. The QR code will be permanently removed.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleDelete(deleteQr)}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-semibold text-sm sm:text-base transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
                <button
                  onClick={() => setDeleteQr(null)}
                  disabled={isDeleting}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-semibold text-sm sm:text-base transition-colors"
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
