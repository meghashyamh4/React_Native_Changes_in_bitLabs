import apiClient from "./login/ApiClient";

export const createLead = async (leadData) => {
    try {
        console.log("🔄 Creating Lead with Data:", leadData); // Log data before sending

        const response = await apiClient.post(`/zoho/create-lead`,leadData);

        console.log("✅ API Response:", response.data); // Log success response

        if (response.status === 200 || response.status === 201) {
            return response.data?.data?.[0].details.id || null;
        } else {
            console.error(" Failed to submit lead:", response.data);
            return null;
        }
    } catch (error) {
        console.error("API Call Failed:", error); // Log the complete error object

        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(" Error submitting lead:", errorMessage);

        throw new Error(`Failed to create lead: ${errorMessage}`);
    }
};


export const searchLead = async(email) => {
    const endpoint = `/zoho/searchlead/${encodeURIComponent(email)}`;
    
    if (!email) {
        console.error("❌ [API] Email is required for searching leads");
        return null;
      }
  
      try {
        console.log('📡 [API] GET', endpoint);
        const response = await apiClient.get(endpoint);
  
        console.log('✅ [API] Response Status:', response.status);
        console.log('📥 [API] Response Data:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 200 || response.status === 201) {
          const leadId = response.data?.data?.[0]?.id || null;
          console.log("✅ [API] Lead search result:", leadId ? "Found" : "Not found");
          if (leadId) {
            console.log("✅ [API] Lead ID:", leadId);
          }
          return leadId;
        } else {
          console.error("❌ [API] Failed to find lead", response.data);
          return null;
        }
      } catch (error) {
        console.log('❌ [API] Error Status:', error?.response?.status);
        console.log('❌ [API] Error Response:', JSON.stringify(error?.response?.data, null, 2));
        const errorMessage = error.response ? error.response.data : error.message;
        console.error("❌ [API] Error finding lead:", errorMessage);
        throw new Error(`Failed to search lead: ${errorMessage}`);
      }
};

export const updateLead = async (leadId, leadData) => {
  const endpoint = `/zoho/update/${leadId}`;
  
  console.log('📡 [API] PUT', endpoint);
  console.log('📤 [API] Lead Update Payload:', JSON.stringify(leadData, null, 2));
  
    try {     
        const response = await apiClient.put(endpoint, leadData);
   
        console.log('✅ [API] Response Status:', response.status);
        console.log('📥 [API] Response Data:', JSON.stringify(response.data, null, 2));
   
        if (response.status === 200 || response.status === 201) {
          console.log("✅ [API] Lead successfully updated in Zoho CRM.");
          return response;
        } else {
          console.log('⚠️ [API] Unexpected response status:', response.status);
          return response;
        }
   
      } catch (error) {
        console.log('❌ [API] Error Status:', error?.response?.status);
        console.log('❌ [API] Error Response:', JSON.stringify(error?.response?.data, null, 2));
        console.error("❌ [API] Failed to update lead in Zoho CRM", error);
        throw error;
      }
    
};