/**
 * Fact Verifier Agent Test
 */
/**
 * Test cases
 */
declare const testCases: ({
    name: string;
    request: {
        fact: string;
        context: {
            birthYear: number;
        };
        options: {
            enableWebVerification: boolean;
        };
    };
    expected: {
        status: string;
        summaryIncludes: string[];
        issuesIncludes?: undefined;
    };
} | {
    name: string;
    request: {
        fact: string;
        options: {
            enableWebVerification: boolean;
        };
        context?: undefined;
    };
    expected: {
        status: string;
        issuesIncludes: string[];
        summaryIncludes?: undefined;
    };
})[];
/**
 * Run test
 */
declare function runTest(testCase: typeof testCases[0]): Promise<void>;
/**
 * Main test runner
 */
declare function main(): Promise<void>;
export { main, runTest, testCases };
//# sourceMappingURL=fact-verifier.test.d.ts.map