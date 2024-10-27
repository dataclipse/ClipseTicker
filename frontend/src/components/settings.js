import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaCog } from "react-icons/fa";
import ConfigureModal from "../modules/configure_modal";
import AddApiModal from "../modules/add_api_modal";

function Settings({ set_active_content }) {
    const [api_keys, set_api_keys] = useState([]);
    const [show_modal, set_show_modal] = useState(false);
    const [show_add_modal, set_show_add_modal] = useState(false);
    const [selected_api_key, set_selected_api_key] = useState(null);
    const [selected_service, set_selected_service] = useState(null);

    // Fetch API keys when the settings page is loaded
    useEffect(() => {
        fetch('/api/keys')
           .then(response => {
              if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
              return response.json();
           })
           .then(data => set_api_keys(data))
           .catch(err => console.error('Error fetching API keys:', err));
    }, []);

    const add_api_key = () => set_show_add_modal(true);

    const save_new_api_key = (new_service, new_api_key) => {
        fetch('/api/keys', {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({ service: new_service, api_key: new_api_key }),
        })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
            })
            .then(() => set_api_keys([...api_keys, { service: new_service, api_key: new_api_key }]))
            .catch(err => console.error('Error saving new API key:', err));
    };

    const delete_api_key = (service) => {
        fetch(`/api/keys/${service}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                set_api_keys(api_keys.filter(key => key.service !== service));
            })
            .catch(err => console.error(`Error deleting API key for service: ${service}`, err));
    };

    const config_modal = (service, api_key) => {
        set_selected_service(service);
        set_selected_api_key(api_key);
        set_show_modal(true);
    };

    const save_changes = (updated_service, updated_api_key) => {
        fetch(`/api/keys/${selected_service}`, {
            method: 'PUT',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({ service: updated_service, api_key: updated_api_key }),
        })
       .then(response => {
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          const updated_keys = api_keys.map(key => (key.service === selected_service ? { service: updated_service, api_key: updated_api_key } : key));
          set_api_keys(updated_keys);
       })
       .catch(err => console.error('Error updating API key:', err));
    };

    return (
        <div className='settings-page'>
            <h1>Settings</h1>
            <hr />
            <h2>
                API Keys
                <button className='add-api-button' onClick={add_api_key}>
                    <FaPlus />
                </button>
            </h2>
            <table className='api-keys-table'>
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>API Key</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {api_keys.length > 0 ? (
                        api_keys.map((key, index) => (
                            <tr key={index}>
                                <td>{key.service}</td>
                                <td>{key.api_key}</td>
                                <td>
                                    <button 
                                        className='configure-button' 
                                        onClick={() => config_modal(key.service, key.api_key)}
                                        title="Configure API Key"
                                    >
                                        <FaCog />
                                    </button>
                                    <button 
                                        className='trash-button' 
                                        onClick={() => delete_api_key(key.service)}
                                        title="Delete API Key"
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan='3'>No API keys found</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <ConfigureModal
               show={show_modal}
               on_close={() => set_show_modal(false)}
               service={selected_service}
               api_key={selected_api_key}
               on_save={save_changes}
            />
            <AddApiModal
                show={show_add_modal}
                on_close={() => set_show_add_modal(false)}
                on_save={save_new_api_key}
            />
        </div>   
    );
}

export default Settings