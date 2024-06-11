/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import cockpit from 'cockpit';
import { Button } from '@patternfly/react-core';

class FileUploader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      chunksProgress: { completed: 0, number: 0 },
    };
  }

  handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      this.setState({ file }, this.uploadFile);
    }
  }

  sendChunk = (file, chunk, index, totalChunks, channel) => {
    const { handleCallback, fileExtension } = this.props;
    const { chunksProgress } = this.state;
    const reader = new FileReader();

    // Overload the method called once a file has been read (i.e. the asynchronous method readAsArrayBuffer has finished).
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      channel.send(data);

      this.setState((prevState) => ({
        chunksProgress: { completed: file.size, number: prevState.chunksProgress.number + data.length },
      }
    ));

      const progress = chunksProgress.completed !== 0 ? Math.round(100 * (chunksProgress.number / chunksProgress.completed)) : 0;
      handleCallback(``, fileExtension, progress);

      if (index + 1 < totalChunks) {
        this.sendNextChunk(file, index + 1, totalChunks, channel);
      } else {
        handleCallback(`/tmp/${file.name}`, fileExtension, 100);
        channel.control({ command: 'done' }); // No further messages will be sent through the channel.
      }
    };

    reader.readAsArrayBuffer(chunk);
  }

  sendNextChunk = (file, index, totalChunks, channel) => {
    const CHUNK_SIZE = 64 * 1024; // Default size of the message sent to the socket for the RAW channel (max size: 128 kB can kill the process).
    const start = index * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    this.sendChunk(file, chunk, index, totalChunks, channel);
  }

  uploadFile = () => {
    const { file } = this.state;


    const totalChunks = Math.ceil(file.size / (64 * 1024)); // Default size of the message sent to the socket for the RAW channel
    const channel = cockpit.channel({
      binary: true,
      payload: "fsreplace1", // Replace the content of the file given on the path variable
      path: `/tmp/${file.name}`,
      superuser: "try",
    });
    channel.addEventListener("ready", this.sendNextChunk(file, 0, totalChunks, channel))
  }

  render() {
    const { fileExtension } = this.props;

    return (
      <div>
        <input type="file" accept={fileExtension} onChange={this.handleFileChange} style={{ display: 'none' }} ref={input => this.fileInput = input} />
        <Button onClick={() => this.fileInput.click()} variant="secondary" style={{ margin: '10px' }}>
          +
        </Button>
      </div>
    );
  }
}

export default FileUploader;
