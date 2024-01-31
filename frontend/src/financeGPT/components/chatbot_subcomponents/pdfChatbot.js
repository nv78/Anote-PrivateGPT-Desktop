import Navbarchatbot from "../NavbarChatbot";


function pdfChatbot() {
    return (
      <div>
        <Navbarchatbot/>
        <div style={gridStyle}>
          PDF Chatbot Page
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
  
  export default pdfChatbot;
  