import React, { Component } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

class AbletonTrackTable extends Component {
  render() {
    const { audioTracks, midiTracks } = this.props;  // Receive props from AbletonDashboard

    return (
      <div>
        {/* Audio Tracks Table */}
        <Typography variant="h6" color="white" gutterBottom>Audio Tracks</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Track Name</TableCell>
                <TableCell>Device Chain</TableCell>
                <TableCell>Parameters</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {audioTracks.map((track) => (
                <TableRow key={track.Id}>
                  <TableCell>{track.Name.Value}</TableCell>
                  <TableCell>
                    {track.DeviceChain && track.DeviceChain.Devices.AudioEffectDevice
                      ? track.DeviceChain.Devices.AudioEffectDevice.ClassName
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {track.DeviceChain && track.DeviceChain.Devices.AudioEffectDevice
                      ? track.DeviceChain.Devices.AudioEffectDevice.Parameter.Value.Value
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* MIDI Tracks Table */}
        <Typography variant="h6" color="white" gutterBottom sx={{ marginTop: '20px' }}>MIDI Tracks</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Track Name</TableCell>
                <TableCell>Clip</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {midiTracks.map((track) => (
                <TableRow key={track.Id}>
                  <TableCell>{track.Name.Value}</TableCell>
                  <TableCell>
                    {track.Clips && track.Clips.MidiClip
                      ? `Clip ID: ${track.Clips.MidiClip.Id}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {track.Clips && track.Clips.MidiClip && track.Clips.MidiClip.Notes.Note
                      ? `Pitch: ${track.Clips.MidiClip.Notes.Note.Pitch.Value}, Velocity: ${track.Clips.MidiClip.Notes.Note.Velocity.Value}`
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  }
}

export default AbletonTrackTable;
