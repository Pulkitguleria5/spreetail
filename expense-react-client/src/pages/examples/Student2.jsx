// Without destructuring, you need to manually take out
// values to render.
function Student2(props) {
    
    return (
        <>
            <p>
                Student Name: {props.name}
                <br/>
                Roll Number: {props.rollNumber}
            </p>
        </>
    );
}

export default Student2;