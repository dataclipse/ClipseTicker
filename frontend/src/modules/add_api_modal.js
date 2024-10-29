import React, { useState, useEffect } from "react";
import '../css/add_api_modal.css';

function AddApiModal({ show, on_close, service, api_key, on_save }) {
    const [new_service, set_new_service] = useState(service);
    const [new_api_key, set_new_api_key] = useState(api_key);

    useEffect(() => {
        if (show) {
            set_new_service(service);
            set_new_api_key(api_key);
        }
    }, [show, service, api_key]);

    const handle_save  = () => {
        if (new_service && new_api_key) {
            on_save(new_service, new_api_key);
            on_close();
        } else {
            alert("Please fill in both service name and API key.")
        }
    };

    if (!show) return null;

    return (
        <div className='modal-backdrop-api'>
            <div className='modal-content-api'>
                <h2>Add API Key</h2>
                <div className='modal-input-block'>
                    <label>Service Name:</label>
                    <input
                        type='text'
                        value={new_service}
                        onChange={(e) => set_new_service(e.target.value)}
                        placeholder="Enter Service Name"
                    />
                </div>
                <div className='modal-input-block'>
                    <label>API Key:</label>
                    <input
                        type='text'
                        value={new_api_key}
                        onChange={(e) => set_new_api_key(e.target.value)}
                        placeholder="Enter API Key"
                    />
                </div>
                <div className='modal-actions'>
                    <button onClick={handle_save}>Save</button>
                    <button onClick={on_close}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default AddApiModal;