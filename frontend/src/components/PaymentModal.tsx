import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Wallet, CreditCard, CheckCircle2 } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  method: "esewa" | "khalti";
  qrImages: string[];
  onZoomImage: (url: string) => void;
}

const methodConfig = {
  esewa: {
    label: "eSewa",
    icon: Wallet,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-600",
    steps: [
      "Open your eSewa mobile app on your phone",
      "Tap on 'Scan QR' from the home screen",
      "Scan the QR code shown in the registration form",
      "Confirm the payment amount displayed",
      "Complete the payment and take a screenshot",
      "Upload the screenshot in the registration form",
    ],
  },
  khalti: {
    label: "Khalti",
    icon: CreditCard,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    iconBg: "bg-violet-600",
    steps: [
      "Open your Khalti mobile app on your phone",
      "Tap on 'Scan & Pay' from the home screen",
      "Scan the QR code shown in the registration form",
      "Confirm the payment amount displayed",
      "Complete the payment and take a screenshot",
      "Upload the screenshot in the registration form",
    ],
  },
};

const PaymentModal = ({ open, onClose, method, qrImages, onZoomImage }: PaymentModalProps) => {
  const config = methodConfig[method];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900 p-0 overflow-hidden">
        <div className="p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className={`p-2.5 ${config.iconBg} rounded-xl`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              Pay with {config.label}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm mt-2">
              Scan the QR code to complete your payment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* QR Display */}
            <div className="flex justify-center">
              {qrImages.length > 0 ? (
                <div className="flex gap-4 flex-wrap justify-center">
                  {qrImages.map((url, i) => (
                    <div
                      key={i}
                      className="w-48 h-48 bg-white rounded-xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-slate-300 transition-all shadow-lg border border-slate-100"
                      onClick={() => onZoomImage(url)}
                    >
                      <img
                        src={url}
                        alt={`QR ${i + 1}`}
                        className="w-full h-full object-contain p-3"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-48 h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400">
                  <span className="text-sm">No QR codes available</span>
                </div>
              )}
            </div>

            {/* Steps */}
            <div className="space-y-2.5">
              <p className="text-base font-semibold text-slate-700">How to pay:</p>
              <ol className="space-y-2">
                {config.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <CheckCircle2 className={`w-5 h-5 mt-0.5 ${config.color} shrink-0`} />
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-xs text-slate-400 text-center pt-2">
              After payment, upload the receipt screenshot in the registration form to complete your registration
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
