// Processing Home page

export async function loadProcessingHomePage() { 
     
    const contentArea = document.getElementById("contentArea"); 
    contentArea.innerHTML = ``; 
    const card = document.createElement("div"); 
    card.classList.add("card"); 

    card.innerHTML = `
        <h2>Processing Home Page</h2>

        <div>
            <p>Processing home page information will be displayed here.</p>
        </div>
    `; 

    contentArea.appendChild(card); 
        
} 
