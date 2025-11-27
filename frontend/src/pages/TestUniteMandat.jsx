import React, { useState } from 'react';
import axios from 'axios';

// Configure axios base URL if not already configured globally
// Assuming the API is at http://localhost:8000/api/v1 based on typical Laravel setups
// Adjust if necessary. The user didn't specify the port, but usually it's 8000 or 80.
// Since the user is using XAMPP, it might be localhost/TGI/backend/public/api/v1 or similar.
// But usually React apps proxy requests. Let's assume relative path '/api/v1' works if proxy is set up,
// or try to guess. Given the file paths, it's a local setup.
// Let's use a configurable base URL.

const API_BASE = 'http://localhost:8000/api/v1'; // Standard Laravel serve port
// Or maybe it's served via Apache on XAMPP?
// If XAMPP: http://localhost/TGI/backend/public/api/v1

export default function TestUniteMandat() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
    };

    const runTest = async () => {
        setLoading(true);
        setLogs([]);
        addLog('Starting test...', 'info');

        try {
            // 1. Create Proprietaire
            const propData = {
                nom_raison: `Test Owner ${Date.now()}`,
                type_proprietaire: 'personne',
                email: `owner${Date.now()}@test.com`,
                telephone: '0600000000',
                ville: 'Tanger'
            };
            addLog(`Creating Proprietaire: ${propData.nom_raison}...`);
            const propRes = await axios.post(`${API_BASE}/proprietaires`, propData);
            const prop = propRes.data;
            addLog(`Proprietaire created. ID: ${prop.id}`, 'success');

            // 2. Create Unite
            const uniteData = {
                numero_unite: `U-${Date.now()}`,
                type_unite: 'appartement',
                immeuble: 'Immeuble Test',
                statut: 'vacant'
            };
            addLog(`Creating Unite: ${uniteData.numero_unite}...`);
            const uniteRes = await axios.post(`${API_BASE}/unites`, uniteData);
            const unite = uniteRes.data;
            addLog(`Unite created. ID: ${unite.id}`, 'success');

            // 3. Link Owner & Create Mandat
            addLog('Linking Owner and creating Mandat (generate_documents=true)...');
            const linkData = {
                unite_id: unite.id,
                date_debut: new Date().toISOString().split('T')[0],
                owners: [
                    {
                        proprietaire_id: prop.id,
                        part_numerateur: 1,
                        part_denominateur: 1
                    }
                ],
                generate_documents: true,
                mandat_template_type: 'auto',
                mandat_langue: 'fr'
            };

            const linkRes = await axios.post(`${API_BASE}/unites/${unite.id}/owners-groups`, linkData);
            addLog('Link response: ' + JSON.stringify(linkRes.data), 'success');

            if (linkRes.data.generated_documents && linkRes.data.generated_documents.length > 0) {
                addLog(`Generated ${linkRes.data.generated_documents.length} documents.`, 'success');
            } else {
                addLog('No documents generated!', 'warning');
            }

        } catch (error) {
            console.error(error);
            addLog(`Error: ${error.message}`, 'error');
            if (error.response) {
                addLog(`Server Response: ${JSON.stringify(error.response.data)}`, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Test Creation Unite & Mandat</h1>

            <div className="mb-6">
                <button
                    onClick={runTest}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Running...' : 'Run Test Sequence'}
                </button>
            </div>

            <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
                {logs.length === 0 && <p className="text-gray-500">Logs will appear here...</p>}
                {logs.map((log, i) => (
                    <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-600' :
                            log.type === 'success' ? 'text-green-600' :
                                log.type === 'warning' ? 'text-yellow-600' : 'text-gray-800'
                        }`}>
                        <span className="text-gray-400">[{log.time}]</span> {log.msg}
                    </div>
                ))}
            </div>
        </div>
    );
}
