export async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      
      if (errorData.message) {
        if (Array.isArray(errorData.message)) {
          return errorData.message.join(', ');
        }
        return errorData.message;
      }
      
      if (errorData.error) {
        return errorData.error;
      }
    }
    const text = await response.text();
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.message) {
          return Array.isArray(parsed.message) 
            ? parsed.message.join(', ')
            : parsed.message;
        }
        return parsed.error || text;
      } catch {
        return text;
      }
    }
    
    return response.statusText || `요청에 실패했습니다. (${response.status})`;
  } catch (error) {
    console.error('에러 응답 파싱 실패:', error);
    return response.statusText || `요청에 실패했습니다. (${response.status})`;
  }
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    try {
      const jsonMatch = message.match(/\{[\s\S]*"message"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.message) {
          return Array.isArray(parsed.message) 
            ? parsed.message.join(', ')
            : parsed.message;
        }
      }
    } catch {
    }
    
    return message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return '알 수 없는 오류가 발생했습니다.';
}

