import Modal from "./Modal";

const LockedTaskModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} title="Task Locked" actionLabel="Back to Map" onClose={onClose}>
    Complete the previous task with at least 60% to unlock this task.
  </Modal>
);

export default LockedTaskModal;
