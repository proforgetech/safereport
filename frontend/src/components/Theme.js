export const COLORS = {
  background: '#121212', // Deep dark
  surface: '#1E1E1E',   // Slightly lighter for cards
  primary: '#BB86FC',   // Vibrant purple
  primaryVariant: '#3700B3',
  secondary: '#03DAC6', // Teal accent
  error: '#CF6679',     // Soft red for errors
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  border: '#333333',
};

export const globalStyles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#000000', // Dark text on light primary color
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: COLORS.secondary,
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
  },
};
