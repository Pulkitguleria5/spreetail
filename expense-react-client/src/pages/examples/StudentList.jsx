import Student3 from "./Student3";

function StudentList({ students }) {
    return (
        <>
            <h2>Student List</h2>
            {students.map((student, index) => (
                <Student3 
                    key={index}
                    name={student.name} 
                    rollNumber={student.rollNumber} 
                    percentage={student.percentage}
                />
            ))}
        </>
    );
}

export default StudentList;