import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import categories from '../data/categories.json';
import { useTheme } from '../context/ThemeContext';
import { useWords } from '../context/WordsContext';
import { radii, spacing } from '../theme/spacing';
import ConfirmDialog from '../components/ConfirmDialog';
import FilterChips from '../components/FilterChips';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import { hapticError, hapticLight, hapticSuccess } from '../utils/haptics';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const PARTS_OF_SPEECH = ['noun', 'verb', 'adjective', 'adverb'];

function createForm(word) {
  return {
    word: word?.word ?? '',
    phonetic: word?.phonetic ?? '',
    partOfSpeech: word?.partOfSpeech ?? 'noun',
    level: word?.level ?? 'Beginner',
    category: word?.category ?? categories[0].name,
    meaning: word?.meaning ?? '',
    examples: (word?.examples ?? ['', '']).join('\n'),
    synonyms: (word?.synonyms ?? []).join(', '),
    antonyms: (word?.antonyms ?? []).join(', '),
    memoryTip: word?.memoryTip ?? '',
  };
}

function Field({ label, value, onChangeText, placeholder, multiline, error, hint, maxLength }) {
  const { theme } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        multiline={multiline}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
        autoCapitalize={label === 'Word' ? 'none' : 'sentences'}
        style={[
          styles.input,
          multiline && styles.multiline,
          { backgroundColor: theme.surface, color: theme.text, borderColor: error ? theme.danger : theme.border },
        ]}
      />
      {error ? <Text style={[styles.fieldError, { color: theme.danger }]}>{error}</Text> : null}
      {!error && hint ? <Text style={[styles.hint, { color: theme.muted }]}>{hint}</Text> : null}
    </View>
  );
}

export default function AddEditWordScreen({ navigation, route }) {
  const { theme } = useTheme();
  const {
    words,
    saveUserWord,
    deleteUserWord,
    loading,
    error: storageError,
  } = useWords();
  const wordId = route.params?.wordId;
  const originalWord = useMemo(() => words.find((word) => word.id === wordId), [wordId, words]);
  const [form, setForm] = useState(() => createForm(originalWord));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: '' } : current));
  };

  const validate = () => {
    const nextErrors = {};
    const normalizedWord = form.word.trim();
    const normalizedMeaning = form.meaning.trim();
    const examples = form.examples.split('\n').map((example) => example.trim()).filter(Boolean);

    if (!normalizedWord) nextErrors.word = 'Enter a word.';
    else if (normalizedWord.length > 40) nextErrors.word = 'Keep the word under 40 characters.';
    else if (!/^[\p{L}][\p{L}' -]*$/u.test(normalizedWord)) {
      nextErrors.word = 'Use letters, spaces, apostrophes, or hyphens only.';
    }

    if (!normalizedMeaning) nextErrors.meaning = 'Add a short meaning.';
    else if (normalizedMeaning.length < 3) nextErrors.meaning = 'The meaning should be at least 3 characters.';
    if (examples.length < 1) nextErrors.examples = 'Add at least one example sentence (one per line).';
    else if (examples.some((example) => example.length < 4)) {
      nextErrors.examples = 'Each example should be a complete sentence.';
    }

    const duplicate = words.find((word) => (
      word.word.trim().toLocaleLowerCase() === normalizedWord.toLocaleLowerCase()
      && word.id !== wordId
    ));
    if (!nextErrors.word && duplicate) nextErrors.word = `“${duplicate.word}” is already in your library.`;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      hapticError();
    }
    return Object.keys(nextErrors).length === 0;
  };

  const showError = (message) => {
    setToastType('error');
    setToast(message);
    hapticError();
  };

  const handleSave = async () => {
    if (saving || !validate()) return;
    setSaving(true);
    try {
      const payload = {
        word: form.word.trim(),
        phonetic: form.phonetic.trim(),
        partOfSpeech: form.partOfSpeech,
        level: form.level,
        category: form.category,
        meaning: form.meaning.trim(),
        examples: form.examples.split('\n').map((example) => example.trim()).filter(Boolean),
        synonyms: form.synonyms.split(',').map((term) => term.trim()).filter(Boolean),
        antonyms: form.antonyms.split(',').map((term) => term.trim()).filter(Boolean),
        memoryTip: form.memoryTip.trim() || `Connect ${form.word.trim()} with its meaning: ${form.meaning.trim()}`,
        createdAt: originalWord?.createdAt ?? new Date().toISOString(),
      };
      await saveUserWord(payload, wordId);
      hapticSuccess();
      navigation.goBack();
    } catch (saveError) {
      showError(saveError.message || 'Could not save your word.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!wordId || saving) return;
    setSaving(true);
    try {
      await deleteUserWord(wordId);
      hapticLight();
      setDeleteDialogVisible(false);
      navigation.goBack();
    } catch (deleteError) {
      setDeleteDialogVisible(false);
      showError(deleteError.message || 'Could not delete your word.');
      setSaving(false);
    }
  };

  if (loading && !originalWord && wordId) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.stateText, { color: theme.muted }]}>Opening editor…</Text>
      </SafeAreaView>
    );
  }

  if (wordId && !originalWord) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]} edges={['top']}>
        <Ionicons name="alert-circle-outline" size={36} color={theme.danger} />
        <Text style={[styles.stateText, { color: theme.text }]}>
          {storageError || 'This word could not be found.'}
        </Text>
        <PrimaryButton title="Go back" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => {
              hapticLight();
              navigation.goBack();
            }}
            style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Ionicons name="arrow-back" size={21} color={theme.text} />
          </Pressable>
          <View style={styles.titleCopy}>
            <Text style={[styles.title, { color: theme.text }]}>
              {wordId ? 'Edit word' : 'Add a word'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              {wordId ? 'Keep your personal vocabulary up to date.' : 'Grow your personal word garden.'}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Field
            label="Word"
            value={form.word}
            onChangeText={(value) => updateForm('word', value)}
            placeholder="e.g. serendipity"
            error={errors.word}
            maxLength={40}
          />

          <Field
            label="Phonetic (optional)"
            value={form.phonetic}
            onChangeText={(value) => updateForm('phonetic', value)}
            placeholder="e.g. /ˌsɛr.ənˈdɪp.ɪ.ti/"
            hint="Add a pronunciation guide if you like."
            maxLength={60}
          />

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Part of speech</Text>
            <FilterChips
              options={PARTS_OF_SPEECH.map((part) => ({
                label: part[0].toLocaleUpperCase() + part.slice(1),
                value: part,
              }))}
              value={form.partOfSpeech}
              onChange={(value) => {
                hapticLight();
                updateForm('partOfSpeech', value);
              }}
              accessibilityLabel="Choose part of speech"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Learning level</Text>
            <FilterChips
              options={LEVELS.map((level) => ({ label: level, value: level }))}
              value={form.level}
              onChange={(value) => {
                hapticLight();
                updateForm('level', value);
              }}
              accessibilityLabel="Choose learning level"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Category</Text>
            <FilterChips
              options={categories.map((category) => ({ label: category.name, value: category.name }))}
              value={form.category}
              onChange={(value) => {
                hapticLight();
                updateForm('category', value);
              }}
              accessibilityLabel="Choose category"
            />
          </View>

          <Field
            label="Meaning"
            value={form.meaning}
            onChangeText={(value) => updateForm('meaning', value)}
            placeholder="Explain what the word means in simple words."
            multiline
            error={errors.meaning}
            maxLength={220}
          />

          <Field
            label="Example sentences"
            value={form.examples}
            onChangeText={(value) => updateForm('examples', value)}
            placeholder={'Finding that book was pure serendipity.\nWe met by happy serendipity.'}
            multiline
            error={errors.examples}
            hint="Add 1 or 2 example sentences (one per line)."
            maxLength={360}
          />

          <Field
            label="Synonyms (optional)"
            value={form.synonyms}
            onChangeText={(value) => updateForm('synonyms', value)}
            placeholder="chance, fluke, blessing"
            hint="Separate words with a comma."
            maxLength={180}
          />

          <Field
            label="Antonyms (optional)"
            value={form.antonyms}
            onChangeText={(value) => updateForm('antonyms', value)}
            placeholder="misfortune, bad luck"
            hint="Separate words with a comma."
            maxLength={180}
          />

          <Field
            label="Memory tip (optional)"
            value={form.memoryTip}
            onChangeText={(value) => updateForm('memoryTip', value)}
            placeholder="A short note or rhyme to help you remember."
            multiline
            maxLength={220}
          />

          <View style={styles.actions}>
            <PrimaryButton
              title={saving ? 'Saving word…' : wordId ? 'Update word' : 'Save word'}
              onPress={handleSave}
              disabled={saving}
            />
            {wordId ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setDeleteDialogVisible(true)}
                disabled={saving}
                style={styles.deleteLink}
              >
                <Ionicons name="trash-outline" size={17} color={theme.danger} />
                <Text style={[styles.deleteText, { color: theme.danger }]}>Delete this word</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast message={toast} type={toastType} onDismiss={() => setToast('')} />
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete this word?"
        message={`“${originalWord?.word ?? 'This word'}” will be removed from your word library. This cannot be undone.`}
        confirmLabel="Delete word"
        destructive
        busy={saving}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  stateText: { fontSize: 14, textAlign: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backButton: { width: 44, height: 44, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  titleCopy: { flex: 1, gap: 2 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  field: { gap: spacing.xs },
  fieldLabel: { fontSize: 14, fontWeight: '700' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: radii.card, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15 },
  multiline: { minHeight: 88 },
  fieldError: { fontSize: 12, lineHeight: 17 },
  hint: { fontSize: 12, lineHeight: 17 },
  actions: { gap: spacing.md, marginTop: spacing.sm },
  deleteLink: { minHeight: 44, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md },
  deleteText: { fontSize: 14, fontWeight: '700' },
});
