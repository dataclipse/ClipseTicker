import React from "react";
import { FaHome } from "react-icons/fa";
import { HiMiniChartBarSquare } from "react-icons/hi2";
import { AiFillSchedule } from "react-icons/ai";

function Sidebar({ onNavigate }) {
    return (
        <aside className='sidebar'>
            <nav>
                <ul>
                    <li onClick={() => onNavigate('home')}><FaHome /> Home</li>
                    <li onClick={() => onNavigate('stocks')}><HiMiniChartBarSquare /> Stocks</li>
                    <li onClick={() => onNavigate('jobs')}><AiFillSchedule /> Jobs</li>
                </ul>
            </nav>
        </aside>
    );
}

export default Sidebar;