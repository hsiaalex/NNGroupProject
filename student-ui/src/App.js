import React, { useState } from "react";
import { Container, TextField, Typography, Button, Card, Grid, Alert, Divider, RadioGroup, FormControlLabel, Radio, FormControl, FormLabel, CircularProgress } from "@mui/material";

const englishLevels = [
  { value: 1, label: "Level 130" },
  { value: 2, label: "Level 131" },
  { value: 3, label: "Level 140" },
  { value: 4, label: "Level 141" },
  { value: 5, label: "Level 150" },
  { value: 6, label: "Level 151" },
  { value: 7, label: "Level 160" },
  { value: 8, label: "Level 161" },
  { value: 9, label: "Level 170" },
  { value: 10, label: "Level 171" },
  { value: 11, label: "Level 180" },
];

const ageGroups = [
  { value: 1, label: "0 - 18" },
  { value: 2, label: "19 - 20" },
  { value: 3, label: "21 - 25" },
  { value: 4, label: "26 - 30" },
  { value: 5, label: "31 - 35" },
  { value: 6, label: "36 - 40" },
  { value: 7, label: "41 - 50" },
  { value: 8, label: "51 - 60" },
  { value: 9, label: "61 - 65" },
  { value: 10, label: "66+" },
];

const schools = [
  { value: 1, label: "Advancement" },
  { value: 2, label: "Business" },
  { value: 3, label: "Communications" },
  { value: 4, label: "Community & Health" },
  { value: 5, label: "Hospitality" },
  { value: 6, label: "Engineering" },
  { value: 7, label: "Transportation" },
];

const fundingTypes = [
  { value: 1, label: "Apprentice_PS" },
  { value: 2, label: "GPOG_FT" },
  { value: 3, label: "Intl Offshore" },
  { value: 4, label: "Intl Regular" },
  { value: 5, label: "Intl Transfer" },
  { value: 6, label: "Joint Program Ryerson" },
  { value: 7, label: "Joint Program UTSC" },
  { value: 8, label: "Second Career Program" },
  { value: 9, label: "Work Safety Insurance Board" },
];

export default function App() {
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    highSchool: "",
    mathScore: "",
    englishGrade: "",
    firstTermGpa: "",
    ageGroup: "",
    gender: "",
    residency: "",
    firstLanguage: "",
    fastTrack: "",
    coop: "",
    prevEducation: "",
    school: "",
    funding: "",
  });

  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: "" });
    }
    setError("");
  };

  const validateForm = () => {
    const errors = {};

    // Academic fields
    if (form.highSchool === "") errors.highSchool = "High School Average is required";
    else if (form.highSchool < 0 || form.highSchool > 100) errors.highSchool = "Must be 0-100";

    if (form.mathScore === "") errors.mathScore = "Math Score is required";
    else if (form.mathScore < 0 || form.mathScore > 50) errors.mathScore = "Must be 0-50";

    if (form.englishGrade === "") errors.englishGrade = "English Grade is required";

    if (form.firstTermGpa === "") errors.firstTermGpa = "First Term GPA is required";
    else if (form.firstTermGpa < 0 || form.firstTermGpa > 4.5) errors.firstTermGpa = "Must be 0-4.5";

    // Demographic fields
    const requiredFields = {
      ageGroup: "Age Group",
      gender: "Gender",
      residency: "Residency",
      firstLanguage: "First Language",
      fastTrack: "Fast Track",
      coop: "Co-op Program",
      prevEducation: "Previous Education",
      school: "School/Faculty",
      funding: "Funding Type",
    };

    for (const [key, label] of Object.entries(requiredFields)) {
      if (form[key] === "") errors[key] = `${label} is required`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          highSchool: parseFloat(form.highSchool),
          mathScore: parseFloat(form.mathScore),
          englishGrade: parseInt(form.englishGrade),
          firstTermGpa: parseFloat(form.firstTermGpa),
          ageGroup: parseInt(form.ageGroup),
          gender: parseInt(form.gender),
          residency: parseInt(form.residency),
          firstLanguage: parseInt(form.firstLanguage),
          fastTrack: parseInt(form.fastTrack),
          coop: parseInt(form.coop),
          prevEducation: parseInt(form.prevEducation),
          school: parseInt(form.school),
          funding: parseInt(form.funding),
        }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.message || "Prediction failed");
      setPrediction({
        gpa: data.predictedSecondTermGpa,
        persistence: data.persistenceProbability,
        completion: data.completionProbability,
        firstTermGpa: data.providedFirstTermGpa,
      });
    } catch (err) {
      setError(`Prediction failed. ${err.message || "Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      highSchool: "",
      mathScore: "",
      englishGrade: "",
      firstTermGpa: "",
      ageGroup: "",
      gender: "",
      residency: "",
      firstLanguage: "",
      fastTrack: "",
      coop: "",
      prevEducation: "",
      school: "",
      funding: "",
    });
    setPrediction(null);
    setError("");
    setFieldErrors({});
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
      <Card sx={{ p: 3, borderRadius: 3, boxShadow: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom align="center">
          Student Performance Predictor
        </Typography>

        <Typography variant="body2" sx={{ textAlign: "center", color: "#666", mb: 3 }}>
          Enter all student information to predict 2nd Term GPA, Persistence & Completion
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <>
          {/* Academic Information */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Academic Information
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {/* Text Fields Grid */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="High School Average (%)"
                name="highSchool"
                type="number"
                fullWidth
                value={form.highSchool}
                onChange={handleChange}
                slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }}
                error={!!fieldErrors.highSchool}
                helperText={fieldErrors.highSchool}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Math Score (0 - 50)"
                name="mathScore"
                type="number"
                fullWidth
                value={form.mathScore}
                onChange={handleChange}
                slotProps={{ htmlInput: { min: 0, max: 50, step: 1 } }}
                error={!!fieldErrors.mathScore}
                helperText={fieldErrors.mathScore}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="First Term GPA (0 - 4.5)"
                name="firstTermGpa"
                type="number"
                fullWidth
                value={form.firstTermGpa}
                onChange={handleChange}
                slotProps={{ htmlInput: { min: 0, max: 4.5, step: 0.1 } }}
                error={!!fieldErrors.firstTermGpa}
                helperText={fieldErrors.firstTermGpa}
              />
            </Grid>
          </Grid>

          {/* Radio Sections Grid */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={8}>
              <FormControl fullWidth error={!!fieldErrors.englishGrade} size="small">
                <FormLabel sx={{ mb: 1, fontWeight: "500" }}>English Grade Level</FormLabel>
                <RadioGroup name="englishGrade" value={form.englishGrade} onChange={handleChange} sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
                  {englishLevels.map((lvl) => (
                    <FormControlLabel key={lvl.value} value={lvl.value} control={<Radio size="small" />} label={lvl.label} sx={{ height: "32px", mb: 0 }} />
                  ))}
                </RadioGroup>
                {fieldErrors.englishGrade && (
                  <Typography variant="caption" color="error">
                    {fieldErrors.englishGrade}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={!!fieldErrors.prevEducation}>
                <FormLabel sx={{ mb: 1, fontWeight: "500" }}>Previous Education</FormLabel>
                <RadioGroup name="prevEducation" value={form.prevEducation} onChange={handleChange}>
                  <FormControlLabel value={1} control={<Radio />} label="High School" />
                  <FormControlLabel value={2} control={<Radio />} label="Post-Secondary" />
                </RadioGroup>
                {fieldErrors.prevEducation && (
                  <Typography variant="caption" color="error">
                    {fieldErrors.prevEducation}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>

          {/* Personal Information */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Personal Information
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth error={!!fieldErrors.ageGroup} size="small">
                <FormLabel sx={{ mb: 1, fontWeight: "500" }}>Age Group</FormLabel>
                <RadioGroup name="ageGroup" value={form.ageGroup} onChange={handleChange} sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0 }}>
                  {ageGroups.map((age) => (
                    <FormControlLabel key={age.value} value={age.value} control={<Radio size="small" />} label={age.label} sx={{ height: "32px", mb: 0 }} />
                  ))}
                </RadioGroup>
                {fieldErrors.ageGroup && (
                  <Typography variant="caption" color="error">
                    {fieldErrors.ageGroup}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth error={!!fieldErrors.gender}>
                <FormLabel sx={{ mb: 1, fontWeight: "500" }}>Gender</FormLabel>
                <RadioGroup name="gender" value={form.gender} onChange={handleChange}>
                  <FormControlLabel value={1} control={<Radio />} label="Female" />
                  <FormControlLabel value={2} control={<Radio />} label="Male" />
                  <FormControlLabel value={3} control={<Radio />} label="Neutral" />
                </RadioGroup>
                {fieldErrors.gender && (
                  <Typography variant="caption" color="error">
                    {fieldErrors.gender}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth error={!!fieldErrors.residency}>
                <FormLabel sx={{ mb: 1, fontWeight: "500" }}>Residency</FormLabel>
                <RadioGroup name="residency" value={form.residency} onChange={handleChange}>
                  <FormControlLabel value={1} control={<Radio />} label="Domestic" />
                  <FormControlLabel value={2} control={<Radio />} label="International" />
                </RadioGroup>
                {fieldErrors.residency && (
                  <Typography variant="caption" color="error">
                    {fieldErrors.residency}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth error={!!fieldErrors.firstLanguage}>
                <FormLabel sx={{ mb: 1, fontWeight: "500" }}>First Language</FormLabel>
                <RadioGroup name="firstLanguage" value={form.firstLanguage} onChange={handleChange}>
                  <FormControlLabel value={1} control={<Radio />} label="English" />
                  <FormControlLabel value={2} control={<Radio />} label="French" />
                  <FormControlLabel value={3} control={<Radio />} label="Other" />
                </RadioGroup>
                {fieldErrors.firstLanguage && (
                  <Typography variant="caption" color="error">
                    {fieldErrors.firstLanguage}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>

          {/* Program Information */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Program Information
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth error={!!fieldErrors.fastTrack}>
                <FormLabel sx={{ mb: 1, fontWeight: "500" }}>Fast Track?</FormLabel>
                <RadioGroup name="fastTrack" value={form.fastTrack} onChange={handleChange}>
                  <FormControlLabel value={1} control={<Radio />} label="Yes" />
                  <FormControlLabel value={2} control={<Radio />} label="No" />
                </RadioGroup>
                {fieldErrors.fastTrack && (
                  <Typography variant="caption" color="error">
                    {fieldErrors.fastTrack}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth error={!!fieldErrors.coop}>
                <FormLabel sx={{ mb: 1, fontWeight: "500" }}>Co-op Program?</FormLabel>
                <RadioGroup name="coop" value={form.coop} onChange={handleChange}>
                  <FormControlLabel value={1} control={<Radio />} label="Yes" />
                  <FormControlLabel value={2} control={<Radio />} label="No" />
                </RadioGroup>
                {fieldErrors.coop && (
                  <Typography variant="caption" color="error">
                    {fieldErrors.coop}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth error={!!fieldErrors.school} size="small">
                <FormLabel sx={{ mb: 1, fontWeight: "500" }}>School / Faculty</FormLabel>
                <RadioGroup name="school" value={form.school} onChange={handleChange} sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0 }}>
                  {schools.map((sc) => (
                    <FormControlLabel key={sc.value} value={sc.value} control={<Radio size="small" />} label={sc.label} sx={{ height: "32px", mb: 0 }} />
                  ))}
                </RadioGroup>
                {fieldErrors.school && (
                  <Typography variant="caption" color="error">
                    {fieldErrors.school}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth error={!!fieldErrors.funding} size="small">
                <FormLabel sx={{ mb: 1, fontWeight: "500" }}>Funding Type</FormLabel>
                <RadioGroup name="funding" value={form.funding} onChange={handleChange} sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0 }}>
                  {fundingTypes.map((fund) => (
                    <FormControlLabel key={fund.value} value={fund.value} control={<Radio size="small" />} label={fund.label} sx={{ height: "32px", mb: 0 }} />
                  ))}
                </RadioGroup>
                {fieldErrors.funding && (
                  <Typography variant="caption" color="error">
                    {fieldErrors.funding}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>

          {/* Submit Button */}
          <Button variant="contained" size="large" fullWidth sx={{ mt: 4, py: 1.5, fontSize: "1.1rem", fontWeight: "bold" }} onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : "GET PREDICTIONS"}
          </Button>
        </>

        {/* Prediction Results - Shown below form */}
        {prediction && (
          <Card sx={{ mt: 4, p: 3, backgroundColor: "#f0f7ff", borderLeft: "5px solid #1976d2" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2", mb: 3 }}>
              📊 Prediction Results
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ p: 2, textAlign: "center", backgroundColor: "#e3f2fd", borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
                    Predicted 2nd Term GPA
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                    {prediction.gpa}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#999" }}>
                    out of 4.5
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ p: 2, textAlign: "center", backgroundColor: "#f3e5f5", borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
                    1st Year Persistence
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", color: "#7b1fa2" }}>
                    {(prediction.persistence * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#999" }}>
                    Probability
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ p: 2, textAlign: "center", backgroundColor: "#e8f5e9", borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
                    Program Completion
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", color: "#388e3c" }}>
                    {(prediction.completion * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#999" }}>
                    Probability
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Button variant="outlined" size="large" fullWidth sx={{ mt: 3, py: 1.5, fontSize: "1rem", fontWeight: "bold" }} onClick={handleReset}>
              CLEAR PREDICTIONS
            </Button>
          </Card>
        )}
      </Card>
    </Container>
  );
}
