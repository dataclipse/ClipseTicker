import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { IoMdRefresh } from "react-icons/io";
import FetchDataModal from '../modules/fetch_data_modal';

function Jobs() {
    const [jobs, set_jobs] = useState([]);
    const [show_fetch_data_modal, set_show_fetch_data_modal] = useState(false);

    useEffect(() => {
        fetch_jobs();

        //Polling to refresh jobs every 5 seconds
        const interval_id = setInterval(() => {
            fetch_jobs();
        }, 5000);

        return () => clearInterval(interval_id);
    }, []);

    // Fetch jobs from API
    const fetch_jobs = () => {
        fetch('/api/jobs')
            .then(response => response.json())
            .then(data => set_jobs(data))
            .catch(err => console.error('Error fetching jobs:', err));
    };

    const delete_job = (job_name, scheduled_start_time) => {
        if (window.confirm(`Are you sure you want to delete the job "${job_name}" scheduled at ${scheduled_start_time}?`)) {
            fetch(`/api/jobs`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ job_name, scheduled_start_time }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error deleting job: ${job_name}`);
                    }
                    set_jobs(jobs.filter(job => !(job.job_name === job_name && job.scheduled_start_time === scheduled_start_time)));
                })
                .catch(err => console.error(`Error deleting job: ${job_name}`, err));
        }
    };

    return (
        <div className='jobs-page'>
            <h1>Data Fetch Job Scheduler</h1>
            <hr />
            <div className='job-controls'>
                <button onClick={() => set_show_fetch_data_modal(true)} className='add-job-button'>
                    <FaPlus /> <strong>Add Job</strong>
                </button>
                <button onClick={fetch_jobs} className='refresh-button'>
                    <IoMdRefresh /> <strong>Refresh</strong>
                </button>
            </div>
            <table className='jobs-table'>
                <thead>
                    <tr>
                        <th>Job Name</th>
                        <th>Scheduled Start Time</th>
                        <th>Status</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Run Time</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {jobs.length > 0 ? (
                        jobs.map((job, index) => (
                            <tr key={index}>
                                <td>{job.job_name}</td>
                                <td>{job.scheduled_start_time}</td>
                                <td>{job.status}</td>
                                <td>{job.start_time}</td>
                                <td>{job.end_time}</td>
                                <td>{job.run_time}</td>
                                <td>
                                    <button 
                                        className='delete-button'
                                        onClick={() => delete_job(job.job_name, job.scheduled_start_time)} 
                                        title="Delete Job"
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan='7'>No Job Found</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <FetchDataModal
                show={show_fetch_data_modal}
                on_close={() => set_show_fetch_data_modal(false)}
            />
        </div>
    );
}

export default Jobs;