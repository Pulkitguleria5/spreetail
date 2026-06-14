function Student1({ name = 'Tommy', rollNumber = 10 }) {
    
    return (
        <>
            <p>
                Student Name: {name}
                <br/>
                Roll Number: {rollNumber}
            </p>
        </>
    );
}

export default Student1;