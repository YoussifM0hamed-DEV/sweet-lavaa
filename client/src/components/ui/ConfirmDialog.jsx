import { FiAlertTriangle } from 'react-icons/fi';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

/** Used before any destructive admin action. */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isLoading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} size="sm">
    <div className="flex gap-4">
      <div
        className={
          tone === 'danger'
            ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600'
            : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600'
        }
      >
        <FiAlertTriangle className="text-xl" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-cocoa-800">{title}</h3>
        {message && <p className="mt-1.5 text-sm leading-relaxed text-cocoa-400">{message}</p>}
      </div>
    </div>

    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
        {cancelLabel}
      </Button>
      <Button
        variant={tone === 'danger' ? 'danger' : 'primary'}
        size="sm"
        onClick={onConfirm}
        isLoading={isLoading}
        loadingText="Working…"
      >
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
