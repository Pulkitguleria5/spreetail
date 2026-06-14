import { useState } from "react";

function Student5() {
    const [visible, setVisible] = useState(true);
    const [buttonText, setButtonText] = useState('Hide Students');

    const studentList = [
        { name: "Tommy", rollNumber: 1 },
        { name: "Pluto", rollNumber: 2 },
        { name: "Sundae", rollNumber: 3 },
    ];

    const handleClick = () => {
        // setVisible(!visible);
        setVisible(() => {
            setButtonText(!visible ? 'Hide Students' : 'Display Students');
            return !visible;
        });
    };

    return (
        <div>
            <button onClick={handleClick}>{buttonText}</button>

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

export default Student5;
