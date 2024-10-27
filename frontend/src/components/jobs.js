import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { IoMdRefresh } from "react-icons/io";
import FetchDataModal from '../modules/fetch_data_modal';
import { sort_items } from '../utils/sort_items';

function Jobs() {
    const [jobs, set_jobs] = useState([]);
    const [show_fetch_data_modal, set_show_fetch_data_modal] = useState(false);
    const [sort_column, set_sort_column] = useState('start_time'); 
    const [sort_direction, set_sort_direction] = useState('desc');

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
            .then(data => {
                const sorted_jobs = sort_items(data, sort_column, sort_direction);
                set_jobs(sorted_jobs);
            })
            .catch(err => console.error('Error fetching jobs:', err));
    };

    // Delete jobs from API
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

    // Handle sorting of the columns
    const handle_sort = (column) => {
        const new_direction = sort_column === column && sort_direction === 'asc' ? 'desc' : 'asc';
        set_sort_column(column);
        set_sort_direction(new_direction);
        set_jobs(prev_jobs => sort_items(prev_jobs, column, new_direction));
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
                        <th className={`sortable ${sort_column === 'job_name' ? sort_direction : ''}`} onClick={() => handle_sort('job_name')}>Job Name</th>
                        <th className={`sortable ${sort_column === 'scheduled_start_time' ? sort_direction : ''}`} onClick={() => handle_sort('scheduled_start_time')}>Scheduled Start Time</th>
                        <th className={`sortable ${sort_column === 'status' ? sort_direction : ''}`} onClick={() => handle_sort('status')}>Status</th>
                        <th className={`sortable ${sort_column === 'start_time' ? sort_direction : ''}`} onClick={() => handle_sort('start_time')}>Start Time</th>
                        <th className={`sortable ${sort_column === 'end_time' ? sort_direction : ''}`} onClick={() => handle_sort('end_time')}>End Time</th>
                        <th className={`sortable ${sort_column === 'run_time' ? sort_direction : ''}`} onClick={() => handle_sort('run_time')}>Run Time</th>
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