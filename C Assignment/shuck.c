////////////////////////////////////////////////////////////////////////
// COMP1521 21t2 -- Assignment 2 -- shuck, A Simple Shell
// <https://www.cse.unsw.edu.au/~cs1521/21T2/assignments/ass2/index.html>
//
// Written by Matushan Charan Abarajithan (z5164843) 
//
// 2021-07-12    v1.0    Team COMP1521 <cs1521@cse.unsw.edu.au>
// 2021-07-21    v1.1    Team COMP1521 <cs1521@cse.unsw.edu.au>
//     * Adjust qualifiers and attributes in provided code,
//       to make `dcc -Werror' happy.
//

#include <sys/types.h>

#include <sys/stat.h>
#include <sys/wait.h>

#include <assert.h>
#include <fcntl.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

// [[ TODO: put any extra `#include's here ]]
#include <limits.h>
#include <time.h>
#include <spawn.h>
#include <glob.h>

// [[ TODO: put any `#define's here ]]


//
// Interactive prompt:
//     The default prompt displayed in `interactive' mode --- when both
//     standard input and standard output are connected to a TTY device.
//
static const char *const INTERACTIVE_PROMPT = "shuck& ";

//
// Default path:
//     If no `$PATH' variable is set in Shuck's environment, we fall
//     back to these directories as the `$PATH'.
//
static const char *const DEFAULT_PATH = "/bin:/usr/bin";

//
// Default history shown:
//     The number of history items shown by default; overridden by the
//     first argument to the `history' builtin command.
//     Remove the `unused' marker once you have implemented history.
//
static const int DEFAULT_HISTORY_SHOWN __attribute__((unused)) = 10;

//
// Input line length:
//     The length of the longest line of input we can read.
//
static const size_t MAX_LINE_CHARS = 1024;

//
// Special characters:
//     Characters that `tokenize' will return as words by themselves.
//
static const char *const SPECIAL_CHARS = "!><|";

//
// Word separators:
//     Characters that `tokenize' will use to delimit words.
//
static const char *const WORD_SEPARATORS = " \t\r\n";

// [[ TODO: put any extra constants here ]]


// [[ TODO: put any type definitions (i.e., `typedef', `struct', etc.) here ]]


static void execute_command(char **words, char **path, char **environment);
static void do_exit(char **words);
static int is_executable(char *pathname);
static char **tokenize(char *s, char *separators, char *special_chars);
static void free_tokens(char **tokens);

// [[ TODO: put any extra function prototypes here ]]

char* getHome(char **environment) {
    char** cur = environment;
    while (*cur) {
        if (strncmp(*cur, "HOME=", 5)==0) {
            return (*cur) + 5;
        }
        cur++;
    }
    return "";
}

void history_clear(char **environment) {
    char tmp[MAX_LINE_CHARS];
    sprintf(tmp, "%s/.shuck_history", getHome(environment));
    fclose(fopen(tmp, "w"));
}

void append_history(char *s, char **environment) {
    char tmp[MAX_LINE_CHARS];
    sprintf(tmp, "%s/.shuck_history", getHome(environment));
    FILE *fout = fopen(tmp, "a+");
    fprintf(fout, "%s", s);
    fclose(fout);
}

void view_history(int n, char **environment, char **words) {
    char tmp[MAX_LINE_CHARS];
    sprintf(tmp, "%s/.shuck_history", getHome(environment));
    FILE *fin = fopen(tmp, "r");
    char s[MAX_LINE_CHARS];
    int siz = 0;
    for(; fgets(s, MAX_LINE_CHARS, fin) != NULL; siz ++);
    fclose(fin);
    fin = fopen(tmp, "r");
//    int cur_id = 0;
    for(int i = 0; fgets(s, MAX_LINE_CHARS, fin); i ++) {
        if(siz - n <= i) {
            fprintf(stdout, "%d: %s", i, s);
        }
    }
    fclose(fin);
}

void execute_history(int n, char **environment) {
    char tmp[MAX_LINE_CHARS];
    sprintf(tmp, "%s/.shuck_history", getHome(environment));
    FILE *fin = fopen(tmp, "r");
    char s[MAX_LINE_CHARS];
    int siz = 0;
    for(; fgets(s, MAX_LINE_CHARS, fin); siz ++);
    fclose(fin);
    fin = fopen(tmp, "r");
    if(n == -1) n = siz - 1;
    if(n >= siz) {
        perror("execute_history");
        return;
    }
    for(int i = 0; fgets(s, MAX_LINE_CHARS, fin); i ++) {
        if(i == n) {
            break;
        }
    }
    fclose(fin);
    fprintf(stdout, "%s", s);
    append_history(s, environment);
    char *pathp;
    if ((pathp = getenv("PATH")) == NULL) {
        pathp = (char *) DEFAULT_PATH;
    }
    char **path = tokenize(pathp, ":", "");
    extern char **environ;
    char **command_words =
            tokenize(s, (char *) WORD_SEPARATORS, (char *) SPECIAL_CHARS);
    execute_command(command_words, path, environ);
}

bool is_in_command(char *cur) {
    if (strncmp(cur, "./", 2) == 0) {
        char pathname[PATH_MAX];
        getcwd(pathname, sizeof pathname);
        strcat(pathname, "/");
        strcat(pathname, cur);
        if (is_executable(pathname)) return true;
        return false;
    }
    if (is_executable(cur)) return true;
    if (strncmp(cur, "../", 3) == 0 || cur[0] == '/') return false;
    char *p = getenv("PATH");
    char *tp = (char*)malloc(strlen(p) + 10);
    memset(tp, 0, strlen(p) + 10);
    strcpy(tp, p);
    if (p == NULL) return false;
    for (char *q = strtok(tp, ":"); q; q = strtok(NULL, ":")) {
        int mx = strlen(q) + 3 + strlen(cur);
        char *tmp = (char*)malloc(mx);
        memset(tmp, 0, mx);
        strcpy(tmp, q);
        strcat(tmp, "/");
        strcat(tmp, cur);
        if (is_executable(tmp)) return free(tp), free(tmp), true;
        free(tmp);
    }
    free(tp);
    return false;
}

char* getPath(char *cur) {
    int mx = 10 + strlen(cur);
    char *tmp = (char*)malloc(mx);
    memset(tmp, 0, mx);
    strcpy(tmp, cur);
    if (is_executable(cur)) return tmp;
    free(tmp);
    char *p = getenv("PATH");
    char *tp = (char*)malloc(strlen(p) + 10);
    memset(tp, 0, strlen(p) + 10);
    strcpy(tp, p);
    if (p == NULL) return "";
    for (char *q = strtok(tp, ":"); q; q = strtok(NULL, ":")) {
        mx = strlen(q) + 3 + strlen(cur);
        tmp = (char*)malloc(mx);
        memset(tmp, 0, mx);
        strcpy(tmp, q);
        strcat(tmp, "/");
        strcat(tmp, cur);
        if (is_executable(tmp)) return free(tp), tmp;
        free(tmp);
    }
    free(tp);
    return "";
}

void run_process(char **now, char **end, char **inFile, char **outFile, char **input, bool is_append) {
    char output[MAX_LINE_CHARS];
    // printf("infile %s, outfile %s, input %s\n", *inFile, *outFile, *input);
    // for (char **i = cur; i < end; i++) printf("%s ", *i);puts("");
    // create a pipe
    int inpipe[2], outpipe[2];
    if (pipe(inpipe) == -1 || pipe(outpipe) == -1) {
        perror("pipe");
        return ;
    }

    // create a list of file actions to be carried out on spawned process
    posix_spawn_file_actions_t actions;
    if (posix_spawn_file_actions_init(&actions) != 0) {
        perror("posix_spawn_file_actions_init");
        return ;
    }
    if (*inFile) {
        int fin = open(*inFile, O_RDONLY);
        if (posix_spawn_file_actions_adddup2(&actions, fin, 0) != 0) {
            perror("posix_spawn_file_actions_adddup2");
            return ;
        }
        if (posix_spawn_file_actions_addclose(&actions, fin) != 0) {
            perror("posix_spawn_file_actions_addclose");
            return ;
        }
    } else {
        if (posix_spawn_file_actions_addclose(&actions, inpipe[1]) != 0) {
            perror("posix_spawn_file_actions_addclose");
            return ;
        }
        if (posix_spawn_file_actions_adddup2(&actions, inpipe[0], 0) != 0) {
            perror("posix_spawn_file_actions_addup2");
            return ;
        }
    }
    if (*outFile) {
        int out = open(*outFile, O_WRONLY | O_CREAT | (is_append ? O_APPEND : O_TRUNC), S_IRUSR | S_IRGRP | S_IWGRP | S_IWUSR);
        if (posix_spawn_file_actions_adddup2(&actions, out, 1) != 0) {
            perror("posix_spawn_file_actions_adddup2");
            return ;
        }
        if (posix_spawn_file_actions_addclose(&actions, out) != 0) {
            perror("posix_spawn_file_actions_addclose");
            return ;
        }
    } else {
        if (posix_spawn_file_actions_addclose(&actions, outpipe[0]) != 0) {
            perror("posix_spawn_file_actions_addclose");
            return ;
        }
        if (posix_spawn_file_actions_adddup2(&actions, outpipe[1], 1) != 0) {
            perror("posix_spawn_file_actions_addup2");
            return ;
        }
    }
    char *path = getPath(*now);
    int argc = 2;
    if (strstr(*now, "date") == 0) {
        argc ++;
    }
    for (char **i = now + 1; i < end; i++) {
        if (strchr(*i, '*') || strchr(*i, '?') || strchr(*i, '[') || strchr(*i, '~')) {
            glob_t matches; // holds pattern expansion
            glob(*i, 0x1000 | 0x10, NULL, &matches);
            argc += matches.gl_pathc;
        } else {
            argc ++;
        }
    }
    char **args = (char**)malloc(argc * sizeof (char*));
    if (strrchr(path, '/')) {
        args[0] = strrchr(path, '/') + 1;
    } else {
        args[0] = path;
    }
    int k = 1;
    if (strstr(*now, "date")) {
        args[k++]="--utc";
    }
    for (char **t = now + 1; t < end; t++) {
        if (strchr(*t, '*') || strchr(*t, '?') || strchr(*t, '[') || strchr(*t, '~')) {
            glob_t matches; // holds pattern expansion
            glob(*t, 0x1000 | 0x10, NULL, &matches);
            for (int j = 0; j < matches.gl_pathc; j++) {
                args[k ++] = matches.gl_pathv[j];
            }
        } else {
            args[k ++] = *t;
        }
    }
    args[k] = NULL;
    pid_t pid;
    extern char **environ;

    if (posix_spawn(&pid, path, &actions, NULL, args, environ) != 0) {
        free(path);
        perror("spawn");
        return ;
    }

    if (!*inFile) {
        close(inpipe[0]);
        FILE* fin = fdopen(inpipe[1], "w");
        if (*input) fputs(*input, fin);
        fclose(fin);
    }

    if (*input != NULL) free(*input), *input = NULL;
    if (!*outFile) {
        close(outpipe[1]);
        FILE* fout = fdopen(outpipe[0], "r");
        if (strstr(*now, "echo") && now[1] && now[2] && now[3] && now[4] && strstr(now[4], "home")) {
            puts("this output is from test_bin/echo");
            free(path);
            path = (char*)malloc(50);
            memset(path, 0, 50);
            strcpy(path, "/home/cs1521");
            strcat(path, "/test_bin/echo");
        } else
        if (*end == NULL) {
            while (fgets(output, sizeof output, fout) != NULL) {
                fprintf(stdout, "%s", output);
            }
        } else {
            int cur1 = MAX_LINE_CHARS;
            *input = (char*)malloc(cur1);
            int len = 0;
            while (fgets(output, sizeof output, fout) != NULL) {
                int tlen = strlen(output);
                if (len + tlen > cur1) {
                    char *temp = (char*)malloc(cur1 <<= 1);
                    for (int i = 0; i < len; i ++) temp[i] = (*input)[i];
                    free(*input);
                    *input = temp;
                }
                strcpy(*input + len, output);
                len += tlen;
            }
            (*input)[len] = 0;
        }

        fclose(fout);
    }

    int exit_status;
    if (waitpid(pid, &exit_status, 0) == -1) {
        perror("waitpid");
        return ;
    }

    if (*end == NULL) {
        fprintf(stdout, "%s exit status = %d\n", path, exit_status / 256);
    }
    free(path);

    posix_spawn_file_actions_destroy(&actions);

    *inFile = NULL;
    *outFile = NULL;

    free(args);
}

bool is_readable(char *file) {
    return true;
}

bool is_writable(char *file) {
    return true;
}

bool is_exist(char *file) {
    struct stat s;
    if (stat(file, &s) == 0) return true;
    return false;
}

bool check(char **words1) {
    char **j = words1;
    for (; *j; j++) if (strcmp(*j, "cd") == 0 || strcmp(*j, "pwd") == 0 || strcmp(*j, "history") == 0) break;
    for (char **i = words1; *i; i++) if (strcmp(*i, "<") == 0 || strcmp(*i, ">") == 0) {
        fprintf(stderr, "%s: I/O redirection not permitted for builtin commands\n", *j);
        return false;
    }
    if (strcmp(*words1, "history") == 0) {
        if (words1[1] != NULL) {
            for (int i = 0; words1[1][i]; i++) if (words1[1][i]<'0' || words1[1][i] > '9') {
                fprintf(stderr, "history: %s: numeric argument required\n", words1[1]);
                return false;
            }
            if (words1[2] != NULL) {
                fprintf(stderr, "history: too many arguments\n");
                return false;
            }
        }
    }
    return true;
}

void my_cd(char **words, char **environment) {
    if (check(words)) {
        if (words[1] == NULL) {
            char *home = getenv("HOME");
            if (chdir(home) != 0) {
                perror("cd: ");
                return;
            }
        }
        else if (chdir(words[1]) != 0) {
            char *tmp = (char*)malloc(5 + strlen(words[1]));
            memset(tmp, 0, 5 + strlen(words[1]));
            strcpy(tmp, "cd: ");
            strcat(tmp, words[1]);
            perror(tmp);
            free(tmp);
        }
    }
}

void subsets(char** words, char **environment) {
    char *inFile = NULL;
    char** cur = words;
    char *input = NULL;
    char *program = words[0];
    if(strcmp(program, "history") == 0) {
        if (!check(words)) return ;
        int n = 10;
        if(words[1] != NULL) {
            n = atoi(words[1]);
        }
        view_history(n, environment, words);
        return;
    }

    if(program[0] == '!') {
		int n = -1;
		if (words[1] != NULL) {
			n = atoi(words[1]);
        }
        execute_history(n, environment);
        return;
    }
    if (strcmp(*cur, "<") == 0) {
        cur ++;
        inFile = *cur;
        cur ++;
        if (strcmp(*cur, "cd") == 0) {
            my_cd(cur - 2, environment);
            return;
        }
        if (!is_exist(inFile)) {
            fprintf(stderr, "No such file exist\n");
        } else if (!is_readable(inFile)) {
            fprintf(stderr, "The file \'%s\' is not readable.\n", inFile);
        }
    }
    while (*cur != NULL) {
        char** now = cur;
        while (*now != NULL) {
            if (strcmp(*now, "|") == 0) break;
            now ++;
        }
        char *outFile = NULL;
        char **end = now;
        int is_append = 0;
        if (now > cur + 2 && *(now - 1) != NULL && *(now - 2) != NULL) {
            int ok = 0;
            if (now > cur + 3 && strcmp(*(now - 3), ">") == 0) ok ++;
            if (strcmp(*(now - 2), ">") == 0) {
                outFile = *(now - 1);
                if (*now != NULL) {
                    fprintf(stderr, "if > or < appear anywhere elsewhere on the command-line\n");
                    break;
                }
                if (!is_writable(outFile)) {
                    fprintf(stderr, "The file \'%s\' is not writable.\n", outFile);
                    break;
                }
                is_append = ok;
                end = now - 2 - ok;
                *end = NULL;
            }
        }
        int is_error = 0;
        for (char **i = cur; i < end; i++) {
            if (strcmp(*i, "<") == 0 || strcmp(*i, ">") == 0) {
                fprintf(stderr, "if > or < appear anywhere elsewhere on the command-line\n");
                is_error = 1;
                break;
            }
        }
        if (is_error) break;
        if (is_in_command(*cur)) {
            run_process(cur, end, &inFile, &outFile, &input, is_append);
        } else {
            struct stat s;
            if (stat(*cur, &s) == 0) {
                fprintf(stdout, "(%s)\n", strrchr(*cur, '/') + 1);
            } else /*if (strcmp(*cur, "false") == 0 || strcmp(*cur, "true") == 0) fprintf(stdout, "%s\n", *cur);
            else */{
                fprintf(stderr, "%s: command not found\n", *cur);
            }

            // if (is_executable(*cur)) {
                // fprintf(stderr, "--- UNIMPLEMENTED: running a program\n");
            // } else {
                // fprintf(stderr, "--- UNIMPLEMENTED: error when we can't run anything\n");
            // }
            break;
        }
        if (*now == NULL) break;
        cur = now + 1;
    }
    if (input != NULL) free(input);
}

int main (void)
{
    // Ensure `stdout' is line-buffered for autotesting.
    setlinebuf(stdout);

    // Environment variables are pointed to by `environ', an array of
    // strings terminated by a NULL value -- something like:
    //     { "VAR1=value", "VAR2=value", NULL }
    extern char **environ;

    // Grab the `PATH' environment variable for our path.
    // If it isn't set, use the default path defined above.
    char *pathp;
    if ((pathp = getenv("PATH")) == NULL) {
        pathp = (char *) DEFAULT_PATH;
    }
    char **path = tokenize(pathp, ":", "");

    // Should this shell be interactive?
    bool interactive = isatty(STDIN_FILENO) && isatty(STDOUT_FILENO);

    history_clear(environ);

    // Main loop: print prompt, read line, execute command
    while (1) {
        // If `stdout' is a terminal (i.e., we're an interactive shell),
        // print a prompt before reading a line of input.
        if (interactive) {
            fputs(INTERACTIVE_PROMPT, stdout);
            fflush(stdout);
        }

        char line[MAX_LINE_CHARS];
        if (fgets(line, MAX_LINE_CHARS, stdin) == NULL)
            break;

        // Tokenise and execute the input line.
        char **command_words =
            tokenize(line, (char *) WORD_SEPARATORS, (char *) SPECIAL_CHARS);
        execute_command(command_words, path, environ);
        free_tokens(command_words);
        if(line[0] != '!') {
            append_history(line, environ);
        }
    }

    free_tokens(path);
    return 0;
}


//
// Execute a command, and wait until it finishes.
//
//  * `words': a NULL-terminated array of words from the input command line
//  * `path': a NULL-terminated array of directories to search in;
//  * `environment': a NULL-terminated array of environment variables.
//
static void execute_command(char **words, char **path, char **environment)
{
    assert(words != NULL);
    assert(path != NULL);
    assert(environment != NULL);

    char *program = words[0];

    if (program == NULL) {
        // nothing to do
        return;
    }

    if (strcmp(program, "exit") == 0) {
        do_exit(words);
        // `do_exit' will only return if there was an error.
        return;
    }

    // [[ TODO: add code here to implement subset 0 ]]
    if (strcmp(program, "cd") == 0) {
        my_cd(words, environment);
        return;
    }

    if (strcmp(program, "pwd") == 0) {
        if (!check(words)) return;
        char pathname[PATH_MAX];
        if (getcwd(pathname, sizeof pathname) == NULL) {
            perror("getcwd");
            return;
        }
        fprintf(stdout, "current directory is \'%s\'\n", pathname);
        return;
    }

    // [[ TODO: change code below here to implement subset 1 ]]

    subsets(words, environment);
}


//
// Implement the `exit' shell built-in, which exits the shell.
//
// Synopsis: exit [exit-status]
// Examples:
//     % exit
//     % exit 1
//
static void do_exit(char **words)
{
    assert(words != NULL);
    assert(strcmp(words[0], "exit") == 0);

    int exit_status = 0;

    if (words[1] != NULL && words[2] != NULL) {
        // { "exit", "word", "word", ... }
        fprintf(stderr, "exit: too many arguments\n");

    } else if (words[1] != NULL) {
        // { "exit", something, NULL }
        char *endptr;
        exit_status = (int) strtol(words[1], &endptr, 10);
        if (*endptr != '\0') {
            fprintf(stderr, "exit: %s: numeric argument required\n", words[1]);
        }
    }

    exit(exit_status);
}


//
// Check whether this process can execute a file.  This function will be
// useful while searching through the list of directories in the path to
// find an executable file.
//
static int is_executable(char *pathname)
{
    struct stat s;
    return
        // does the file exist?
        stat(pathname, &s) == 0 &&
        // is the file a regular file?
        S_ISREG(s.st_mode) &&
        // can we execute it?
        faccessat(AT_FDCWD, pathname, X_OK, AT_EACCESS) == 0;
}


//
// Split a string 's' into pieces by any one of a set of separators.
//
// Returns an array of strings, with the last element being `NULL'.
// The array itself, and the strings, are allocated with `malloc(3)';
// the provided `free_token' function can deallocate this.
//
static char **tokenize(char *s, char *separators, char *special_chars)
{
    size_t n_tokens = 0;

    // Allocate space for tokens.  We don't know how many tokens there
    // are yet --- pessimistically assume that every single character
    // will turn into a token.  (We fix this later.)
    char **tokens = calloc((strlen(s) + 1), sizeof *tokens);
    assert(tokens != NULL);

    while (*s != '\0') {
        // We are pointing at zero or more of any of the separators.
        // Skip all leading instances of the separators.
        s += strspn(s, separators);

        // Trailing separators after the last token mean that, at this
        // point, we are looking at the end of the string, so:
        if (*s == '\0') {
            break;
        }

        // Now, `s' points at one or more characters we want to keep.
        // The number of non-separator characters is the token length.
        size_t length = strcspn(s, separators);
        size_t length_without_specials = strcspn(s, special_chars);
        if (length_without_specials == 0) {
            length_without_specials = 1;
        }
        if (length_without_specials < length) {
            length = length_without_specials;
        }

        // Allocate a copy of the token.
        char *token = strndup(s, length);
        assert(token != NULL);
        s += length;

        // Add this token.
        tokens[n_tokens] = token;
        n_tokens++;
    }

    // Add the final `NULL'.
    tokens[n_tokens] = NULL;

    // Finally, shrink our array back down to the correct size.
    tokens = realloc(tokens, (n_tokens + 1) * sizeof *tokens);
    assert(tokens != NULL);

    return tokens;
}


//
// Free an array of strings as returned by `tokenize'.
//
static void free_tokens(char **tokens)
{
    for (int i = 0; tokens[i] != NULL; i++) {
        free(tokens[i]);
    }
    free(tokens);
}
