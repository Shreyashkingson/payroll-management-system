import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LeaveRequest = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get('http://localhost:5000/getLeaveRequests');
      setLeaveRequests(response.data.leaveRequests);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await axios.post(`http://localhost:5000/approveLeave/${requestId}`, {
        notes: approvalNotes
      });
      fetchLeaveRequests();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error approving leave request:', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await axios.post(`http://localhost:5000/rejectLeave/${requestId}`, {
        notes: approvalNotes
      });
      fetchLeaveRequests();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error rejecting leave request:', error);
    }
  };

  const handleOpenDialog = (request) => {
    setSelectedRequest(request);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRequest(null);
    setApprovalNotes('');
  };

  return (
    <div className="bg-card rounded-xl shadow-xl p-8 border-t-8 border-green w-full animate-slide-up overflow-x-auto font-display">
      <h2 className="text-2xl font-extrabold text-green mb-4 text-center font-display">Leave Requests</h2>
      
      <table className="min-w-full table-auto border-collapse font-body">
        <thead>
          <tr className="bg-header text-white">
            <th className="px-4 py-2">Employee</th>
            <th className="px-4 py-2">Department</th>
            <th className="px-4 py-2">Leave Type</th>
            <th className="px-4 py-2">Start Date</th>
            <th className="px-4 py-2">End Date</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaveRequests.map((request) => (
            <tr key={request.leave_id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-4 py-2">{request.employee_name}</td>
              <td className="px-4 py-2">{request.department_name}</td>
              <td className="px-4 py-2">{request.leave_type}</td>
              <td className="px-4 py-2">{new Date(request.leave_start).toLocaleDateString()}</td>
              <td className="px-4 py-2">{new Date(request.leave_end).toLocaleDateString()}</td>
              <td className="px-4 py-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {request.status}
                </span>
              </td>
              <td className="px-4 py-2">
                <button
                  className={`px-3 py-1 rounded ${
                    request.status === 'Pending' 
                      ? 'bg-green text-white hover:bg-green-dark' 
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  onClick={() => handleOpenDialog(request)}
                  disabled={request.status !== 'Pending'}
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-xl p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-4 text-xl text-gray-500 hover:text-red-500" onClick={handleCloseDialog}>&times;</button>
            <h3 className="text-xl font-bold mb-4">Review Leave Request</h3>
            {selectedRequest && (
              <div className="space-y-4">
                <div>
                  <span className="font-bold">Employee:</span> {selectedRequest.employee_name}
                </div>
                <div>
                  <span className="font-bold">Department:</span> {selectedRequest.department_name}
                </div>
                <div>
                  <span className="font-bold">Leave Type:</span> {selectedRequest.leave_type}
                </div>
                <div>
                  <span className="font-bold">Period:</span> {new Date(selectedRequest.leave_start).toLocaleDateString()} - {new Date(selectedRequest.leave_end).toLocaleDateString()}
                </div>
                <div>
                  <label className="block font-bold mb-2">Approval Notes:</label>
                  <textarea
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green"
                    rows="4"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Add notes for approval/rejection..."
                    style={{ color: '#222' }}
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() => handleReject(selectedRequest.leave_id)}
                  >
                    Reject
                  </button>
                  <button
                    className="px-4 py-2 bg-green text-white rounded hover:bg-green-dark"
                    onClick={() => handleApprove(selectedRequest.leave_id)}
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequest; 