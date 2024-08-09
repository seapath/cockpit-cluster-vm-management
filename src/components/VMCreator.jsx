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
  Progress,
  Checkbox,
} from '@patternfly/react-core';
import FileUploader from './fileUploader';

class VMCreator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      vmName: '',
      vmImagePath: '',
      vmXmlPath: '',
      progressUploadXML: 0,
      progressUploadQCOW: 0,
      isVMCreated: null,
      isLiveMigrationEnabled: false,
      migrationUser: '',
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

  handleMigrationUserChange = (e) => {
    this.setState({ migrationUser: e.target.value });
  }

  handleConfirm = () => {
    const { vmName, vmImagePath, vmXmlPath } = this.state;
    const { refreshVMList } = this.props;

    const args = [];
    if (this.state.isLiveMigrationEnabled) {
      args.push('--enable-live-migration');
      args.push('--migration-user');
      args.push(this.state.migrationUser);
    }

    this.setState({ isLoading: true, isVMCreated: null });
    cockpit.spawn(["vm-mgr", "create", "--name", vmName, "--image", vmImagePath, "--xml", vmXmlPath, ...args], { superuser: "try" })
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

  // Handle data received from the child component FileUploader
  handleCallback = (filePath, fileType, progress) => {
    if (fileType === '.xml') {
      this.setState({ progressUploadXML: progress });
    } else if (fileType === '.qcow2') {
      this.setState({ progressUploadQCOW: progress });
    }

    if ( progress === 100) {
      if (fileType === '.xml') {
        this.setState({ vmXmlPath: filePath });
      } else if (fileType === '.qcow2') {
        this.setState({ vmImagePath: filePath });
      }
    }
  }

  handleCheckboxChange = () => {
    this.setState({ isLiveMigrationEnabled: !this.state.isLiveMigrationEnabled });
  }

  render() {
    const { isOpen, onClose } = this.props;
    const { vmName, vmImagePath, vmXmlPath, isLoading, isVMCreated, progressUploadXML, progressUploadQCOW } = this.state;

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
              <FileUploader
                fileExtension=".qcow2"
                handleCallback={(filePath, fileExtension, progress) => this.handleCallback(filePath, fileExtension, progress)}
              />
            </div>
            {progressUploadQCOW > 0 && (
              <Progress value={progressUploadQCOW} />
            )}
          </FormGroup>

          <FormGroup label="Path VM XML *" fieldId="path-vm-xml">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <TextInput
                id="path-vm-xml"
                value={vmXmlPath}
                onChange={this.handleVmXmlPathChange}
              />
              <FileUploader
                fileExtension=".xml"
                handleCallback={(filePath, fileExtension, progress) => this.handleCallback(filePath, fileExtension, progress)}
              />
            </div>
            {progressUploadXML > 0 && (
              <Progress value={progressUploadXML} />
            )}
          </FormGroup>

          <Checkbox
            id="enable-live-migration"
            label="Enable live migration"
            isChecked={this.state.isLiveMigrationEnabled}
            onChange={this.handleCheckboxChange}
          />
          {this.state.isLiveMigrationEnabled && (
            <FormGroup label="Migration User" fieldId="migration-user">
              <TextInput
                id="migration-user"
                value={this.state.migrationUser}
                onChange={this.handleMigrationUserChange}
              />
            </FormGroup>
          )}


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
