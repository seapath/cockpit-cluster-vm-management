import React from 'react';
import {
  Button,
  Modal,
  Form,
  FormGroup,
  TextInput,
  ModalVariant,
  Spinner,
  Alert,
} from '@patternfly/react-core';

class VMCreator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      vmName: '',
      vmImagePath: '',
      vmXmlPath: '',
      isVMCreated: null,
    };
  }

  handleVmNameChange = (e) => {
    this.setState({ vmName: e.target.value });
  }

  handleVmImagePathChange = (e) => {
    this.setState({ vmImagePath: e.target.value });
  }

  handleVmXmlPathChange = (e) => {
    this.setState({ vmXmlPath: e.target.value });
  }

  handleConfirm = () => {
    const { vmName, vmImagePath, vmXmlPath } = this.state;
    const { refreshVMList } = this.props;

    this.setState({ isLoading: true, isVMCreated: null });
    cockpit.spawn(["vm-mgr", "create", "--name", vmName, "--image", vmImagePath, "--xml", vmXmlPath], { superuser: "try" })
      .then(() => {
        this.setState({ isVMCreated: true });
        refreshVMList();
      })
      .catch(error => {
        this.setState({ isVMCreated: false });
        console.error("Error VM creation:", error);
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  }

  render() {
    const { isOpen, onClose } = this.props;
    const { vmName, vmImagePath, vmXmlPath, isLoading, isVMCreated } = this.state;

    return (
      <Modal
        title="VM Creation"
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={onClose}
        actions={[
          <Button key="applyButton" variant="primary" onClick={this.handleConfirm}>
            Apply
          </Button>,
          <Button key="cancelButton" variant="link" onClick={onClose}>
            Cancel
          </Button>,
        ]}
      >

        {isVMCreated !== null && (
          <Alert
            variant={isVMCreated ? 'success' : 'danger'}
            title={isVMCreated ? 'VM successfully created!' : 'Failed to create VM.'}
            style={{ marginTop: '20px' }}
          />
        )}

        <Form>

          <FormGroup label="VM Name" fieldId="vm-name">
            <TextInput
              id="vm-name"
              value={vmName}
              onChange={this.handleVmNameChange}
            />
          </FormGroup>

          <FormGroup label="Path VM Image *" fieldId="path-vm-image">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <TextInput
                id="path-vm-image"
                value={vmImagePath}
                onChange={this.handleVmImagePathChange}
              />
            </div>
          </FormGroup>

          <FormGroup label="Path VM XML *" fieldId="path-vm-xml">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <TextInput
                id="path-vm-xml"
                value={vmXmlPath}
                onChange={this.handleVmXmlPathChange}
              />
            </div>
          </FormGroup>

        </Form>

        <br />
        <div style={{ fontSize: '12px' }}>
          (* path from the host machine)
        </div>
        <br />

        {isLoading && <Spinner size="lg" style={{ marginTop: '20px' }} />}
      </Modal>
    );
  }
}

export default VMCreator;
