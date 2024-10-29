import React, { useState, useEffect } from "react";
import '../css/configure_modal.css';

function ConfigureModal({ show, on_close, service, api_key, on_save }) {
    const [edited_service, set_edited_service] = useState(service);
    const [edited_api_key, set_edited_api_key] = useState(api_key);

    useEffect(() => {
        if (show) {
            set_edited_service(service);
            set_edited_api_key(api_key);
        }
    }, [show, service, api_key]);

    const handle_save  = () => {
        on_save(edited_service, edited_api_key);
        on_close();
    };

    if (!show) return null;

    return (
        <div className='modal-backdrop-configure'>
            <div className='modal-content-configure'>
                <h2>Edit API Key</h2>
                <div className='modal-input-block'>
                    <label>Service Name:</label>
                    <input
                        type='text'
                        value={edited_service}
                        readOnly
                    />
                </div>
                <div className='modal-input-block'>
                    <label>API Key:</label>
                    <input
                        type='text'
                        value={edited_api_key}
                        onChange={(e) => set_edited_api_key(e.target.value)}
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

export default ConfigureModal;