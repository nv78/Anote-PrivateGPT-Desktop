import Navbarchatbot from "../NavbarChatbot";


function mySQLConnector() {
    return (
      <div>
        <Navbarchatbot/>
        <div style={gridStyle}>
          My SQL Connector Page
        </div>
      </div>
    );
  }
  
  
  const gridStyle = {
    marginTop: '60px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridGap: '10px',
    padding: '60px',
    margin: '20px',
    marginLeft: '200px',
  };

  export default mySQLConnector;
  