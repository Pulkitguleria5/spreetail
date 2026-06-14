/**
 * JSX is the combination of HTML, CSS, and Javascript code.
 * Its an extension created by React.
 * 
 * Every compoment must return single parent node which
 * will be rendered.
 * 
 */
function Student() {
    let name = "Tommy";
    let rollNumber = 10;

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

export default Student;