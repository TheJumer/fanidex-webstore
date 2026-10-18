package rcon

import (
	"bytes"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net"
	"time"
)

// Minimal implementation of the Source RCON protocol (used by Minecraft).
// https://wiki.vg/RCON

const (
	typeAuth         = 3
	typeAuthResponse = 2
	typeExecCommand  = 2
	typeRespValue    = 0
)

// Client is a connected RCON session.
type Client struct {
	conn net.Conn
	id   int32
}

// Dial connects and authenticates against the RCON server.
func Dial(host string, port int, password string, timeout time.Duration) (*Client, error) {
	addr := net.JoinHostPort(host, fmt.Sprintf("%d", port))
	conn, err := net.DialTimeout("tcp", addr, timeout)
	if err != nil {
		return nil, err
	}
	_ = conn.SetDeadline(time.Now().Add(timeout))

	c := &Client{conn: conn, id: 1}
	if err := c.writePacket(typeAuth, password); err != nil {
		conn.Close()
		return nil, err
	}
	respID, _, _, err := c.readPacket()
	if err != nil {
		conn.Close()
		return nil, err
	}
	if respID == -1 {
		conn.Close()
		return nil, errors.New("rcon authentication failed (wrong password)")
	}
	return c, nil
}

// Execute runs a command and returns the server response.
func (c *Client) Execute(cmd string) (string, error) {
	if err := c.writePacket(typeExecCommand, cmd); err != nil {
		return "", err
	}
	_, typ, body, err := c.readPacket()
	if err != nil {
		return "", err
	}
	if typ != typeRespValue {
		return body, nil
	}
	return body, nil
}

// Close terminates the connection.
func (c *Client) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func (c *Client) writePacket(typ int32, body string) error {
	c.id++
	var buf bytes.Buffer
	// size = id(4) + type(4) + body + 2 null terminators
	size := int32(4 + 4 + len(body) + 2)
	binary.Write(&buf, binary.LittleEndian, size)
	binary.Write(&buf, binary.LittleEndian, c.id)
	binary.Write(&buf, binary.LittleEndian, typ)
	buf.WriteString(body)
	buf.WriteByte(0)
	buf.WriteByte(0)
	_, err := c.conn.Write(buf.Bytes())
	return err
}

func (c *Client) readPacket() (id int32, typ int32, body string, err error) {
	var size int32
	if err = binary.Read(c.conn, binary.LittleEndian, &size); err != nil {
		return
	}
	if size < 10 || size > 4096 {
		err = errors.New("invalid rcon packet size")
		return
	}
	data := make([]byte, size)
	if _, err = io.ReadFull(c.conn, data); err != nil {
		return
	}
	id = int32(binary.LittleEndian.Uint32(data[0:4]))
	typ = int32(binary.LittleEndian.Uint32(data[4:8]))
	// body is everything except the 2 trailing null bytes
	body = string(data[8 : size-2])
	return
}
