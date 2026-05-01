
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "@context/Authcontext";
import apiClient from "@services/login/ApiClient";
import UserContext from "@context/UserContext";
import { showToast } from "@services/login/ToastService";

const ApplicantSubmitHackathon = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { hackathonId, registrationId: routeRegId } = route.params;
  const id = hackathonId;
  const { userId, userToken } = useAuth();
  const { refreshScore } = useContext(UserContext);

  const [registrationId, setRegistrationId] = useState<number | null>(
    routeRegId || null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    projectTitle: "",
    projectSummary: "",
    technologiesUsed: "",
    githubLink: "",
    demoLink: "",
  });

  const [errors, setErrors] = useState<{
    projectTitle?: string;
    projectSummary?: string;
    technologiesUsed?: string;
    githubLink?: string;
    demoLink?: string;
  }>({});

  /** Fetch registration to get registrationId */
  const fetchRegistration = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(
        `/hackathons/${id}/getRegistrationStatus/${userId}`,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setRegistrationId(res.data.id); // use registrationId
    } catch (err: any) {
      console.error(
        "Error fetching registration:",
        err.response?.status,
        err.message
      );
      Alert.alert("Error", "Could not fetch registration details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistration();
  }, [id]);

  /** Handle input change */
  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  /** Validate form fields */
  const validateForm = (): { isValid: boolean; validationErrors: typeof errors } => {
    const newErrors: typeof errors = {};

    // Project Title validation
    if (!form.projectTitle.trim()) {
      newErrors.projectTitle = "Project Title is required.";
    } else if (form.projectTitle.trim().length < 5) {
      newErrors.projectTitle = "Project Title must be at least 5 characters.";
    } else if (form.projectTitle.trim().length > 255) {
      newErrors.projectTitle = "Project Title must be less than 255 characters.";
    }

    // Project Summary validation
    if (!form.projectSummary.trim()) {
      newErrors.projectSummary = "Project Summary is required.";
    } else if (form.projectSummary.trim().length < 10) {
      newErrors.projectSummary = "Project Summary must be at least 10 characters.";
    }

    // Technologies Used validation
    if (!form.technologiesUsed.trim()) {
      newErrors.technologiesUsed = "Technologies Used is required.";
    } else if (form.technologiesUsed.trim().length < 3) {
      newErrors.technologiesUsed = "Technologies Used must be at least 3 characters.";
    }

    // GitHub Link validation
    if (!form.githubLink.trim()) {
      newErrors.githubLink = "GitHub Link is required.";
    } else {
      // Stricter regex for GitHub repository or profile links
      // Ensures it's a single URL and starts with github.com domain
      const githubPattern = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9._-]+\/?([a-zA-Z0-9._-]+\/?)?.*$/i;
      const spaceCheck = /\s/;

      if (spaceCheck.test(form.githubLink.trim())) {
        newErrors.githubLink = "Only one GitHub link is allowed.";
      } else if (!githubPattern.test(form.githubLink.trim())) {
        newErrors.githubLink = "Please enter a valid GitHub link (e.g., github.com/username/repo).";
      }
    }

    // Demo Link validation (optional, but if provided, should be valid URL)
    if (form.demoLink.trim() && form.demoLink.trim().length > 0) {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)*\/?$/i;
      if (!urlPattern.test(form.demoLink.trim())) {
        newErrors.demoLink = "Please enter a valid URL.";
      }
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      validationErrors: newErrors,
    };
  };

  /** Submit project */
  const handleSubmit = async () => {
    if (!registrationId) {
      showToast("error", "No registration found.");
      return;
    }

    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      // Get all error messages
      const errorMessages = Object.values(validation.validationErrors).filter(msg => msg && msg.trim() !== '');
      if (errorMessages.length > 0) {
        const errorText = errorMessages.length === 1
          ? errorMessages[0]
          : `Please fix the highlighted errors: ${errorMessages.map((msg, idx) => `${idx + 1}. ${msg}`).join(' ')}`;
        showToast("error", errorText);
      } else {
        showToast("error", "Please fill all required fields.");
      }
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        registrationId,
        userId,
        ...form,
      };

      console.log("🚀 [HACKATHON] Submitting project with payload:", JSON.stringify(payload, null, 2));
      console.log("🚀 [HACKATHON] Using Token:", userToken ? "Token exists" : "No Token");

      const response = await apiClient.post(
        `/api/hackathons/${id}/submit`,
        payload,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      console.log("✅ [HACKATHON] Submission Response:", response.data);

      // Refresh score after hackathon submission
      if (refreshScore) {
        console.log("🔄 [HACKATHON] Refreshing score after submission...");
        await refreshScore();
      }

      // Show success toast
      showToast("success", "Project submitted successfully!");

      // Navigate to Arena page after successful submission
      try {
        navigation.navigate('BottomTab', { screen: 'Arena' });
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        navigation.reset({
          index: 0,
          routes: [{ name: 'BottomTab', params: { screen: 'Arena' } }],
        });
      }
    } catch (err: any) {
      console.error("❌ [HACKATHON] Submission Error Detailed:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data,
          headers: err.config?.headers
        }
      });
      const serverError = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message;
      const errorMessage = serverError || err.message || "Failed to submit project. Please try again.";
      showToast("error", errorMessage.trim());
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.skeletonTitle} />

        {/* Form Fields Skeleton */}
        <View style={styles.skeletonFormGroup}>
          <View style={styles.skeletonLabel} />
          <View style={styles.skeletonInput} />
        </View>

        <View style={styles.skeletonFormGroup}>
          <View style={styles.skeletonLabel} />
          <View style={[styles.skeletonInput, styles.skeletonTextarea]} />
        </View>

        <View style={styles.skeletonFormGroup}>
          <View style={styles.skeletonLabel} />
          <View style={styles.skeletonInput} />
        </View>

        <View style={styles.skeletonFormGroup}>
          <View style={styles.skeletonLabel} />
          <View style={styles.skeletonInput} />
        </View>

        <View style={styles.skeletonFormGroup}>
          <View style={styles.skeletonLabel} />
          <View style={styles.skeletonInput} />
        </View>

        <View style={styles.skeletonSubmitBtn} />
      </ScrollView>
    );
  }

  return (
    <ImageBackground
      source={require("../../assests/Images/backgrounds/image.png")}
      style={styles.background}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Custom Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Icon name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Submit Project</Text>
              <View style={styles.backButtonPlaceholder} />
            </View>
          </View>

          <View style={styles.formContainer}>
            {/* <Text style={styles.title}>Submit Your Project</Text> */}

            {/* Project Title */}
            <Text style={styles.label}>
              Project Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                errors.projectTitle && styles.inputError,
              ]}
              placeholder="Enter Project Title"
              placeholderTextColor="gray"
              selectionColor="#F97316"
              value={form.projectTitle}
              onChangeText={(text) => handleChange("projectTitle", text)}
            />
            {errors.projectTitle && (
              <Text style={styles.errorText}>{errors.projectTitle}</Text>
            )}

            {/* Project Summary */}
            <Text style={styles.label}>
              Project Summary <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textarea,
                errors.projectSummary && styles.inputError,
              ]}
              placeholder="Enter Project Summary"
              placeholderTextColor="gray"
              selectionColor="#F97316"
              multiline
              numberOfLines={4}
              value={form.projectSummary}
              onChangeText={(text) => handleChange("projectSummary", text)}
            />
            {errors.projectSummary && (
              <Text style={styles.errorText}>{errors.projectSummary}</Text>
            )}

            {/* Technologies Used */}
            <Text style={styles.label}>
              Technologies Used <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                errors.technologiesUsed && styles.inputError,
              ]}
              placeholder="Enter Technologies Used"
              placeholderTextColor="gray"
              selectionColor="#F97316"
              value={form.technologiesUsed}
              onChangeText={(text) => handleChange("technologiesUsed", text)}
            />
            {errors.technologiesUsed && (
              <Text style={styles.errorText}>{errors.technologiesUsed}</Text>
            )}

            {/* GitHub Link */}
            <Text style={styles.label}>
              GitHub Link <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                errors.githubLink && styles.inputError,
              ]}
              placeholder="Enter GitHub Link"
              placeholderTextColor="gray"
              selectionColor="#F97316"
              value={form.githubLink}
              onChangeText={(text) => handleChange("githubLink", text)}
            />
            {errors.githubLink && (
              <Text style={styles.errorText}>{errors.githubLink}</Text>
            )}

            {/* Demo Link (Optional) */}
            <Text style={styles.label}>Demo Link (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                errors.demoLink && styles.inputError,
              ]}
              placeholder="Enter Demo Link"
              placeholderTextColor="gray"
              selectionColor="#F97316"
              value={form.demoLink}
              onChangeText={(text) => handleChange("demoLink", text)}
            />
            {errors.demoLink && (
              <Text style={styles.errorText}>{errors.demoLink}</Text>
            )}

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitText}>
                {submitting ? "Submitting..." : "Submit Response"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default ApplicantSubmitHackathon;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  background: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header styles
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  backButtonPlaceholder: {
    width: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },

  // Form container
  formContainer: {
    padding: 16,
  },

  // Heading
  title: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans-Bold",
    marginBottom: 16,
    color: "#333",
  },

  // Labels
  label: { fontSize: 14, fontFamily: "PlusJakartaSans-Medium", marginBottom: 4, color: "#000" },
  required: { color: "#F97316", fontFamily: "PlusJakartaSans-Bold" },

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    fontFamily: "PlusJakartaSans-Medium",
    backgroundColor: "#fafafa",
    color: "#000",
  },
  inputError: {
    borderColor: "#d32f2f",
  },
  textarea: {
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 12,
    color: "#d32f2f",
    fontFamily: "PlusJakartaSans-Medium",
    marginTop: -8,
    marginBottom: 8,
  },

  // Submit button
  submitBtn: {
    backgroundColor: "#F97316",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  submitText: { color: "#fff", fontFamily: "PlusJakartaSans-Bold", fontSize: 16 },
  // Skeleton Loading Styles
  skeletonTitle: {
    width: "60%",
    height: 24,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 24,
  },
  skeletonFormGroup: {
    marginBottom: 20,
  },
  skeletonLabel: {
    width: 140,
    height: 18,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 8,
  },
  skeletonInput: {
    width: "100%",
    height: 48,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  skeletonTextarea: {
    height: 100,
  },
  skeletonSubmitBtn: {
    width: "100%",
    height: 50,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    marginTop: 8,
    marginBottom: 30,
  },
});
