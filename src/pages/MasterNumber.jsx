import React from 'react';
import MasterForwarding from './MasterForwarding';
import AddForwarding from '../components/AddForwarding';

const MasterNumber = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">Master Number Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-blue-700">Add New Forwarding</h2>
          <AddForwarding />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-blue-700">Current Forwarding Rules</h2>
          <MasterForwarding />
        </div>
      </div>
    </div>
  );
};

export default MasterNumber;