import { useState } from "react";

function Student4() {
    const [visible, setVisible] = useState(true);

    const studentList = [
        { name: "Tommy", rollNumber: 1 },
        { name: "Pluto", rollNumber: 2 },
        { name: "Sundae", rollNumber: 3 },
    ];

    const handleClick = () => {
        setVisible(!visible);
    };

    return (
        <div>
            <button onClick={handleClick}>{visible ? 'Hide Students' : 'Display Students'}</button>

            {visible && (
                <>
                    {studentList.map((s) => (
                        <p>
                            Roll Number: {s.rollNumber}
                            <br />
                            Name: {s.name}
                        </p>
                    ))}
                </>
            )}
        </div>
    );
}

export default Student4;
