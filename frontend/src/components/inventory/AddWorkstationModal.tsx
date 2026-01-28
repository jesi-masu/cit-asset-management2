import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface Props {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface WorkstationEntry {
  id: string; // Temporary ID for tracking
  workstation_name: string;
  lab_id: number;
}

const AddWorkstationModal: React.FC<Props> = ({ show, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [labs, setLabs] = useState<{ lab_id: number; lab_name: string; location?: string }[]>([]);
  const [name, setName] = useState("");
  const [workstations, setWorkstations] = useState<WorkstationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load Labs for the dropdown
  useEffect(() => {
    if (show) {
      api.get("/laboratories").then((res) => setLabs(res.data));
    }
  }, [show]);

  // Get the lab ID for the current user (for custodians)
  const getUserLabId = (): number | null => {
    if (user?.role === "Custodian" && user.lab_id) {
      return user.lab_id;
    }
    return null;
  };

  // Get the lab that should be selected (for custodians, it's their assigned lab)
  const getSelectedLab = () => {
    const userLabId = getUserLabId();
    if (userLabId) {
      return labs.find(lab => lab.lab_id === userLabId);
    }
    return null;
  };

  const selectedLab = getSelectedLab();

  const handleAddWorkstation = () => {
    if (!name.trim()) {
      alert("Please enter a workstation name");
      return;
    }

    const userLabId = getUserLabId();
    if (!userLabId && !selectedLab) {
      alert("Please select a lab");
      return;
    }

    const newWorkstation: WorkstationEntry = {
      id: Date.now().toString(), // Temporary ID
      workstation_name: name.trim(),
      lab_id: userLabId || (selectedLab?.lab_id || 0),
    };

    setWorkstations([...workstations, newWorkstation]);
    setName(""); // Clear input for next entry
  };

  const handleRemoveWorkstation = (id: string) => {
    setWorkstations(workstations.filter(ws => ws.id !== id));
  };

  const handleSubmitAll = async () => {
    if (workstations.length === 0) {
      alert("Please add at least one workstation");
      return;
    }

    setSubmitting(true);
    try {
      // Create all workstations in a single batch
      const workstationData = workstations.map(ws => ({
        workstation_name: ws.workstation_name,
        lab_id: ws.lab_id,
      }));

      await api.post("/workstations/batch", { workstations: workstationData });
      alert(`Successfully created ${workstations.length} workstation(s)!`);
      
      // Reset form
      setWorkstations([]);
      setName("");
      
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create workstations");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setWorkstations([]);
    setName("");
    onClose();
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40"></div>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gray-800 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Workstations</h3>
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors"
                onClick={handleClose}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {/* Input Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workstation Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. WS-PC1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddWorkstation())}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location (Lab) <span className="text-red-500">*</span>
                  </label>
                  {selectedLab ? (
                    // Fixed, non-editable lab for custodians
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                      {selectedLab.lab_name} {selectedLab.location && `(${selectedLab.location})`}
                    </div>
                  ) : (
                    // Editable dropdown for admins
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue=""
                    >
                      <option value="">Select Lab...</option>
                      {labs.map((lab) => (
                        <option key={lab.lab_id} value={lab.lab_id}>
                          {lab.lab_name} {lab.location && `(${lab.location})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Add Button */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleAddWorkstation}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Workstation
                </button>
              </div>

              {/* Workstations Table */}
              {workstations.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">
                      Workstations to Create ({workstations.length})
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Workstation Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location (Lab)
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {workstations.map((workstation) => {
                          const lab = labs.find(l => l.lab_id === workstation.lab_id);
                          return (
                            <tr key={workstation.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {workstation.workstation_name}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {lab?.lab_name || "Unknown Lab"} {lab?.location && `(${lab.location})`}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWorkstation(workstation.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Remove workstation"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex items-center justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                onClick={handleClose}
              >
                Cancel
              </button>
              {workstations.length > 0 && (
                <button
                  type="button"
                  onClick={handleSubmitAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? `Creating ${workstations.length} Workstation(s)...` : `Create ${workstations.length} Workstation(s)`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddWorkstationModal;
