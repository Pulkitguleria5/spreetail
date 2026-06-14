function Student3({ name, rollNumber, percentage }) {
    return (
        <>
            {percentage > 33.0 && (
                <p>
                    Student Name: {name}
                    <br/>
                    Roll Number: {rollNumber}
                    <br/>
                    Percentage: {percentage}
                    <br/>
                    Result: Pass
                </p>
            )}

            {percentage <= 33.0 && (
                <p>
                Student Name: {name}
                <br/>
                Roll Number: {rollNumber}
                <br/>
                Percentage: {percentage}
                <br/>
                Result: Fail
            </p>
            )}
        </>
    );
}

export default Student3;