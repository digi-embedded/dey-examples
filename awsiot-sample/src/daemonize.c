/*
 * Copyright (c) 2017 Digi International Inc.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 * =======================================================================
 *
 * From http://www.itp.uzh.ch/~dpotter/howto/daemonize
 *
 */

#include <aws_iot_log.h>
#include <errno.h>
#include <limits.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/file.h>
#include <sys/stat.h>
#include <unistd.h>

/*------------------------------------------------------------------------------
                    F U N C T I O N  D E C L A R A T I O N S
------------------------------------------------------------------------------*/
static void daemonize(char const *const daemon_name);
static void signal_handler(int signum);
static int get_lock(char const *const file_name);
static void release_lock(int const fd);

/*------------------------------------------------------------------------------
                         G L O B A L  V A R I A B L E S
------------------------------------------------------------------------------*/
static volatile sig_atomic_t signal_from_child = 0;

/*------------------------------------------------------------------------------
                     F U N C T I O N  D E F I N I T I O N S
------------------------------------------------------------------------------*/
/**
 * start_daemon() - Start a new daemon.
 *
 * @name:	Daemon name.
 *
 * Return: 0 on success, 1 otherwise.
 */
int start_daemon(const char *name)
{
	int result = EXIT_SUCCESS;
	int lock_fd = -1;

	/* Daemonize if requested. */
	lock_fd = get_lock(name);
	if (lock_fd < 0) {
		IOT_ERROR("Unable to start %s. It may be currently running", name);
		result = EXIT_FAILURE;
		goto done;
	}
	daemonize(name);

done:
	/* Clean up. */
	IOT_INFO("Daemon terminated");
	release_lock(lock_fd);

	return result;
}

/**
 * daemonize() - Daemonize the current process using the given name.
 *
 * @name: Daemon name.
 */
static void daemonize(char const *const name)
{
	pid_t pid, sid, parent;
	FILE *pid_fp = NULL;
	char pid_filename[PATH_MAX];

	/* Already a daemon. */
	if (getppid() == 1) {
		return;
	}

	IOT_DEBUG("Start daemon %s", name);

	/* Open .pid file while root. We can write it once we know child PID. */
	umask(0022);
	snprintf(pid_filename, sizeof(pid_filename), "/var/run/%s.pid", name);
	pid_fp = fopen(pid_filename, "w+");
	if (pid_fp == NULL) {
		IOT_ERROR("Unable to open pid file (errno: %d)", errno);
		exit(EXIT_FAILURE);
	}

	/* Trap signals that we expect to receive. */
	signal(SIGCHLD, signal_handler);
	signal(SIGUSR1, signal_handler);
	signal(SIGALRM, signal_handler);

	/* Fork off the parent process. */
	pid = fork();
	if (pid < 0) {
		IOT_ERROR("Unable to fork daemon (errno: %d, %s)", errno, strerror(errno));
		exit(EXIT_FAILURE);
	}
	/* If we got a good PID, then we can exit the parent process. */
	if (pid > 0) {
		int fork_succeeded;
		int exit_code;

		/* Write the PID of the newly created child process into the file. */
		if (fprintf(pid_fp, "%d\n", pid) <= 0) {
			IOT_ERROR("Unable to write pid file (errno: %d)", errno);
			fclose(pid_fp);
			/* Do we want to do anything about the child that has just started
			 * at this point. */
			exit(EXIT_FAILURE);
		}

		fclose(pid_fp);

		fork_succeeded = 0;
		/* Wait for confirmation from the child via SIGTERM or SIGCHLD, or
		 * for two seconds to elapse (SIGALRM). pause() should return after two
		 * seconds at most. */
		alarm(2);
		if (signal_from_child)
			fork_succeeded = 1;
		pause();
		if (signal_from_child)
			fork_succeeded = 1;

		exit_code = fork_succeeded ? EXIT_SUCCESS : EXIT_FAILURE;
		exit(exit_code);
	}

	/* At this point we are executing as the child process. */
	parent = getppid();

	/* Cancel certain signals. */
	signal(SIGCHLD, SIG_DFL); /* A child process dies */
	signal(SIGTSTP, SIG_IGN); /* Various TTY signals */
	signal(SIGTTOU, SIG_IGN);
	signal(SIGTTIN, SIG_IGN);
	signal(SIGHUP, SIG_IGN); /* Ignore hangup signal */
	signal(SIGTERM, SIG_DFL); /* Die on SIGTERM */

	/* Change the file mode mask. */
	umask(0);

	/* Create a new SID for the child process. */
	sid = setsid();
	if (sid < 0) {
		IOT_ERROR("Unable to create a new session (errno %d, %s)",
			  errno, strerror(errno));
		exit(EXIT_FAILURE);
	}

	/* Change the current working directory.  This prevents the current
	 directory from being locked; hence not being able to remove it. */
	if (chdir("/") < 0) {
		IOT_ERROR("Unable to change directory to '%s', (errno %d, %s)", "/",
			  errno, strerror(errno));
		exit(EXIT_FAILURE);
	}

	/* Redirect standard files to /dev/null.
	 * Log an error, but otherwise ignore it. */
	if (freopen("/dev/null", "r", stdin) == NULL)
		IOT_ERROR("Failed to redirect stdin to /dev/null");
	if (freopen("/dev/null", "w", stdout) == NULL)
		IOT_ERROR("Failed to redirect stdout to /dev/null");
	if (freopen("/dev/null", "w", stderr) == NULL)
		IOT_ERROR("Failed to redirect stderr to /dev/null");

	/* Tell the parent process that we are A-okay. */
	kill(parent, SIGUSR1);
}

/**
 * signal_handler() - Manage signal received.
 *
 * @signum: Received signal.
 */
static void signal_handler(int signum)
{
	switch (signum) {
	case SIGALRM:
		/* Ignore this signal.*/
		break;
	case SIGUSR1:
		signal_from_child = 1;
		break;
	case SIGCHLD:
		exit(EXIT_FAILURE);
		break;
	default:
		break;
	}
}

/**
 * get_lock() - Try to get lock
 *
 * @file_name:	Name of the file used as lock inside '/var/lock'.
 *
 * Return: File descriptor of lock file, or -1 on error.
 */
static int get_lock(char const *const file_name)
{
	static char const path[] = "/var/lock/";
	char full_path[sizeof(path) + strlen(file_name)];
	int fd;

	snprintf(full_path, sizeof(full_path), "%s%s", path, file_name);

	fd = open(full_path, O_RDWR | O_CREAT, S_IRUSR | S_IWUSR);
	if (fd == -1) {
		IOT_ERROR("Could not open PID file '%s'", full_path);
		goto error;
	}

	if (flock(fd, LOCK_EX | LOCK_NB) != 0) {
		IOT_ERROR("Could not open lock PID file '%s'", full_path);
		goto error;
	}

	if (ftruncate(fd, 0) != 0) {
		IOT_ERROR("Could not truncate PID file '%s'", full_path);
		goto error;
	}

	{
		char buf[50];
		int len = snprintf(buf, sizeof(buf), "%ld", (long) getpid());

		if (write(fd, buf, len) != len) {
			IOT_ERROR("Error writing to PID file '%s'", full_path);
			goto error;
		}
	}
	goto done;

error:
	release_lock(fd);
	fd = -1;

done:
	return fd;
}

/**
 * release_lock() - Release the lock obtained with 'get_lock(file_name)'
 *
 * @fd:	File descriptor of lock file.
 */
static void release_lock(int const fd)
{
	if (fd < 0)
		return;

	if (ftruncate(fd, 0) == -1)
		IOT_ERROR("Could not truncate PID file");

	if (lockf(fd, F_ULOCK, 0) == -1)
		IOT_ERROR("Unable to unlock");

	close(fd);
}
