import { useSelector } from 'react-redux';

function Dashboard() {
    const user = useSelector((state) => state.userDetails);

    return (
        <div className="max-w-4xl mx-auto px-4 text-center">
            <h4 className="text-2xl font-semibold text-slate-900">
                Welcome, {user.name}!
            </h4>
        </div>
    );
}

export default Dashboard;