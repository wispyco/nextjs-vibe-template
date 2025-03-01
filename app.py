import streamlit as st
import litellm
import os
from dotenv import load_dotenv
import time

# Load environment variables from .env file (if any)
load_dotenv()

# Configure page settings
st.set_page_config(
    page_title="4xDev - Generate Multiple Web Apps",
    page_icon="🧪",
    layout="wide",
)

# Add custom CSS
st.markdown("""
<style>
.app-container {
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 10px;
    background-color: #f9f9f9;
}
.code-box {
    border-radius: 8px;
    border: 1px solid #ddd;
    overflow: auto;
    max-height: 300px;
}
.stButton button {
    width: 100%;
}
h1, h2, h3 {
    color: #1E88E5;
}
</style>
""", unsafe_allow_html=True)

# Set Groq API key
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    st.warning("⚠️ GROQ_API_KEY environment variable not found. Please set it to use this app.")

def generate_web_app(prompt, variation_prompt=""):
    """Generate web app code using litellm to query Groq API"""
    try:
        full_prompt = f"""Create a simple, self-contained web application based on this prompt: 
        {prompt} 
        {variation_prompt}
        
        The code should be complete and runnable as a single file.
        Focus on creating a working prototype that demonstrates the core functionality.
        Use modern web technologies and best practices.
        Keep the code concise but include helpful comments.
        Return ONLY the code without explanations.
        """
        
        response = litellm.completion(
            model="groq/llama-3.1-8b-instant",
            messages=[{"role": "user", "content": full_prompt}],
            api_key=groq_api_key,
            temperature=0.7,
            max_tokens=2048,
        )
        
        return response.choices[0].message.content
    except Exception as e:
        return f"Error generating code: {str(e)}"

# App title and description
st.title("🧪 4xDev - Web App Generator")
st.markdown("""
Generate four different web applications from a single prompt using Groq's LLama3-70B model.
Enter your idea below and see what gets created!
""")

# User input
with st.form(key="app_form"):
    user_prompt = st.text_area(
        "Describe the web application you want to create:",
        placeholder="E.g., A to-do list app with local storage and dark mode",
        height=100
    )
    
    submit_button = st.form_submit_button(label="🚀 Generate 4 Web Apps")

# Generate apps on form submission
if submit_button and user_prompt and groq_api_key:
    with st.spinner("🔮 Generating your web applications..."):
        # Create variations to get different results
        variations = [
            "",
            "Make it visually appealing and use a different framework than the other versions.",
            "Focus on simplicity and performance. Use minimal dependencies.",
            "Add some creative features that might not be explicitly mentioned in the prompt."
        ]
        
        # Generate 4 different web apps
        results = []
        for i, variation in enumerate(variations):
            with st.status(f"Generating app {i+1}/4..."):
                app_code = generate_web_app(user_prompt, variation)
                results.append(app_code)
                time.sleep(0.5)  # Small delay for better UX
    
    # Display the results in a 2x2 grid
    st.subheader("📊 Generated Web Apps")
    
    # First row
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("<div class='app-container'>", unsafe_allow_html=True)
        st.markdown("### App 1 - Standard Version")
        with st.expander("View Code", expanded=True):
            st.code(results[0], language="python")
        st.markdown("</div>", unsafe_allow_html=True)
        
    with col2:
        st.markdown("<div class='app-container'>", unsafe_allow_html=True)
        st.markdown("### App 2 - Visual Focus")
        with st.expander("View Code", expanded=True):
            st.code(results[1], language="python")
        st.markdown("</div>", unsafe_allow_html=True)
        
    # Second row
    col3, col4 = st.columns(2)
    with col3:
        st.markdown("<div class='app-container'>", unsafe_allow_html=True)
        st.markdown("### App 3 - Minimalist Version")
        with st.expander("View Code", expanded=True):
            st.code(results[2], language="python")
        st.markdown("</div>", unsafe_allow_html=True)
        
    with col4:
        st.markdown("<div class='app-container'>", unsafe_allow_html=True)
        st.markdown("### App 4 - Creative Approach")
        with st.expander("View Code", expanded=True):
            st.code(results[3], language="python")
        st.markdown("</div>", unsafe_allow_html=True)
    
    st.success("✅ All applications generated successfully!")
    
    st.markdown("""
    ### 💡 Next Steps
    - Copy the code you like best
    - Save it to a file with the appropriate extension (.html, .py, etc.)
    - Run or deploy your chosen application
    """)
elif submit_button and not groq_api_key:
    st.error("Please set your GROQ_API_KEY environment variable to use this app.")
elif submit_button and not user_prompt:
    st.warning("Please enter a prompt to generate web applications.")

# Footer
st.markdown("---")
st.markdown("Made with ❤️ using Streamlit and Groq's LLama3-70B")

