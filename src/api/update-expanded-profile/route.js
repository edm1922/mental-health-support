async function handler({
  displayName,
  age,
  gender,
  location,
  interests,
  occupation,
  preferredContactMethod,
  emergencyContact,
  languages,
  aboutMe,
  seekingHelpFor,
  comfortWithSharing,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (displayName !== undefined) {
    updateFields.push(`display_name = $${paramCount}`);
    values.push(displayName);
    paramCount++;
  }

  if (age !== undefined) {
    if (age < 13) {
      return { error: "Age must be 13 or older" };
    }
    updateFields.push(`age = $${paramCount}`);
    values.push(age);
    paramCount++;
  }

  if (gender !== undefined) {
    const validGenders = [
      "male",
      "female",
      "non-binary",
      "other",
      "prefer not to say",
    ];
    if (!validGenders.includes(gender)) {
      return { error: "Invalid gender value" };
    }
    updateFields.push(`gender = $${paramCount}`);
    values.push(gender);
    paramCount++;
  }

  if (location !== undefined) {
    updateFields.push(`location = $${paramCount}`);
    values.push(location);
    paramCount++;
  }

  if (interests !== undefined) {
    updateFields.push(`interests = $${paramCount}`);
    values.push(interests);
    paramCount++;
  }

  if (occupation !== undefined) {
    updateFields.push(`occupation = $${paramCount}`);
    values.push(occupation);
    paramCount++;
  }

  if (preferredContactMethod !== undefined) {
    const validMethods = ["email", "phone", "messaging", "video"];
    if (!validMethods.includes(preferredContactMethod)) {
      return { error: "Invalid preferred contact method" };
    }
    updateFields.push(`preferred_contact_method = $${paramCount}`);
    values.push(preferredContactMethod);
    paramCount++;
  }

  if (emergencyContact !== undefined) {
    updateFields.push(`emergency_contact = $${paramCount}`);
    values.push(emergencyContact);
    paramCount++;
  }

  if (languages !== undefined) {
    updateFields.push(`languages = $${paramCount}`);
    values.push(languages);
    paramCount++;
  }

  if (aboutMe !== undefined) {
    updateFields.push(`about_me = $${paramCount}`);
    values.push(aboutMe);
    paramCount++;
  }

  if (seekingHelpFor !== undefined) {
    updateFields.push(`seeking_help_for = $${paramCount}`);
    values.push(seekingHelpFor);
    paramCount++;
  }

  if (comfortWithSharing !== undefined) {
    updateFields.push(`comfort_with_sharing = $${paramCount}`);
    values.push(comfortWithSharing);
    paramCount++;
  }

  if (updateFields.length === 0) {
    return { error: "No fields to update" };
  }

  const query = `
    UPDATE user_profiles 
    SET ${updateFields.join(", ")}
    WHERE user_id = $${paramCount}
    RETURNING *
  `;

  values.push(session.user.id);

  try {
    const [updatedProfile] = await sql(query, values);
    return { profile: updatedProfile };
  } catch (error) {
    return { error: "Failed to update profile" };
  }
}