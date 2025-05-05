export interface Country {
  isoAlpha3: string;
  name: string;
}

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company: string;
  title: string;
  phone: string;
  country: string;
  reason: string;
  userType: string;
  teamId: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface SignUpProps {
  onSubmit?: (formData: FormData) => void;
}
