import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface WorkstationAsset {
  asset_id: number;
  property_tag_no: string | null;
  serial_number: string | null;
  description: string | null;
  quantity: number | null;
  unit_name: string | null;
}

interface Workstation {
  workstation_id: number;
  workstation_name: string;
  lab_name: string | null;
  location: string | null;
  assets: WorkstationAsset[];
}

interface Props {
  show: boolean;
  onClose: () => void;
}

const WorkstationReport: React.FC<Props> = ({ show, onClose }) => {
  const { user } = useAuth();
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLab, setSelectedLab] = useState<string>("");
  const [labs, setLabs] = useState<{ lab_id: number; lab_name: string }[]>([]);

  useEffect(() => {
    if (show) {
      fetchLabs();
      fetchWorkstations();
    }
  }, [show, selectedLab]);

  const fetchLabs = async () => {
    try {
      const response = await api.get("/laboratories");
      setLabs(response.data);
    } catch (error) {
      console.error("Failed to fetch labs:", error);
    }
  };

  const fetchWorkstations = async () => {
    setLoading(true);
    try {
      const url = selectedLab ? `/workstations?lab_id=${selectedLab}` : "/workstations";
      const response = await api.get(url);
      
      const transformedWorkstations: Workstation[] = response.data.map((ws: any) => ({
        workstation_id: ws.workstation_id,
        workstation_name: ws.workstation_name,
        lab_name: ws.laboratory?.lab_name || "N/A",
        location: ws.laboratory?.location || "N/A",
        assets: ws.assets?.map((asset: any) => ({
          asset_id: asset.asset_id,
          property_tag_no: asset.details?.property_tag_no || null,
          serial_number: asset.details?.serial_number || null,
          description: asset.details?.description || null,
          quantity: asset.details?.quantity || 1,
          unit_name: asset.units?.unit_name || null,
        })) || [],
      }));

      setWorkstations(transformedWorkstations);
    } catch (error) {
      console.error("Failed to fetch workstations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("printable-report");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups for this website to print the report.");
      return;
    }

    const printStyles = `
      <style>
        @page { margin: 0.5in; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          font-size: 12px; 
          line-height: 1.4;
          margin: 0;
          padding: 0;
        }
        .report-header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .report-title { 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 10px;
          color: #1a1a1a;
        }
        .report-subtitle { 
          font-size: 14px; 
          color: #666; 
          margin-bottom: 5px;
        }
        .workstation-section { 
          margin-bottom: 40px; 
          page-break-inside: avoid;
        }
        .workstation-header { 
          background-color: #f8f9fa; 
          padding: 12px; 
          border: 1px solid #dee2e6;
          border-radius: 4px;
          margin-bottom: 15px;
        }
        .workstation-name { 
          font-size: 16px; 
          font-weight: bold; 
          color: #1a1a1a;
          margin-bottom: 5px;
        }
        .workstation-info { 
          font-size: 13px; 
          color: #666;
        }
        .assets-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px;
        }
        .assets-table th { 
          background-color: #e9ecef; 
          padding: 8px; 
          text-align: left; 
          font-weight: bold;
          border: 1px solid #dee2e6;
          font-size: 11px;
        }
        .assets-table td { 
          padding: 6px 8px; 
          border: 1px solid #dee2e6;
          vertical-align: top;
        }
        .no-assets { 
          font-style: italic; 
          color: #666; 
          text-align: center;
          padding: 20px;
        }
        .summary-section {
          margin-top: 30px;
          padding: 15px;
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
        }
        .summary-title {
          font-weight: bold;
          margin-bottom: 10px;
        }
        @media print {
          .no-print { display: none !important; }
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Workstation Inventory Report</title>
          ${printStyles}
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getTotalAssets = () => {
    return workstations.reduce((total, ws) => total + ws.assets.length, 0);
  };

  const getTotalQuantity = () => {
    return workstations.reduce((total, ws) => 
      total + ws.assets.reduce((wsTotal, asset) => wsTotal + (asset.quantity || 0), 0), 0
    );
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40"></div>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h3 className="text-lg font-semibold">Workstation Inventory Report</h3>
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors"
                onClick={onClose}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by Laboratory
                    </label>
                    <select
                      value={selectedLab}
                      onChange={(e) => setSelectedLab(e.target.value)}
                      className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Laboratories</option>
                      {labs.map((lab) => (
                        <option key={lab.lab_id} value={lab.lab_id}>
                          {lab.lab_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={fetchWorkstations}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={loading || workstations.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print Report</span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded border mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{workstations.length}</div>
                    <div className="text-sm text-gray-600">Total Workstations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{getTotalAssets()}</div>
                    <div className="text-sm text-gray-600">Total Assets</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{getTotalQuantity()}</div>
                    <div className="text-sm text-gray-600">Total Quantity</div>
                  </div>
                </div>
              </div>

              <div id="printable-report">
                <div className="report-header">
                  <div className="report-title">Workstation Inventory Report</div>
                  <div className="report-subtitle">Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</div>
                  <div className="report-subtitle">Generated by: {user?.name} ({user?.role})</div>
                  {selectedLab && (
                    <div className="report-subtitle">Laboratory: {labs.find(l => l.lab_id === Number(selectedLab))?.lab_name}</div>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading workstation data...</div>
                  </div>
                ) : workstations.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">No workstations found</div>
                  </div>
                ) : (
                  workstations.map((workstation) => (
                    <div key={workstation.workstation_id} className="workstation-section">
                      <div className="workstation-header">
                        <div className="workstation-name">{workstation.workstation_name}</div>
                        <div className="workstation-info">
                          Laboratory: {workstation.lab_name} | Location: {workstation.location}
                        </div>
                      </div>

                      {workstation.assets.length === 0 ? (
                        <div className="no-assets">No assets assigned to this workstation</div>
                      ) : (
                        <table className="assets-table">
                          <thead>
                            <tr>
                              <th>Property Tag</th>
                              <th>Serial Number</th>
                              <th>Unit Name</th>
                              <th>Description</th>
                              <th>Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {workstation.assets.map((asset) => (
                              <tr key={asset.asset_id}>
                                <td>{asset.property_tag_no || "-"}</td>
                                <td>{asset.serial_number || "-"}</td>
                                <td>{asset.unit_name || "-"}</td>
                                <td>{asset.description || "-"}</td>
                                <td>{asset.quantity || 1}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))
                )}

                {workstations.length > 0 && (
                  <div className="summary-section">
                    <div className="summary-title">Report Summary</div>
                    <div>Total Workstations: {workstations.length}</div>
                    <div>Total Assets: {getTotalAssets()}</div>
                    <div>Total Quantity: {getTotalQuantity()}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
              <button onClick={onClose} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkstationReport;
